---
title: "Building a lie detector for The D-AI-LY"
featured: true
author: Dmitry Shkolnik
pubDatetime: 2026-01-11T00:00:00.000Z
description: "Building a system using skills and defensive engineering to catch a model that's very good at lying convincingly to you."
tags:
  - cansim
  - thedaily
  - llm
  - ai
slug: the-daily-lie-detector
categories:
  - ai
  - experimental
  - projects
---

This is a follow up post to [The D-AI-LY](https://www.dshkol.com/posts/the-daily/) going into more detail on the specific data validation and enforcement steps that the system uses to reduce hallucination and data errors. Even as an explicitly AI-generated project, generating articles with mistakes and imagined data is invalidating. Code to do simple data analysis and front-end is not that complex. The main value here is demonstrate we can do these statistical reports at scale -- and with human-like accuracy. Otherwise, there's not much value in this project.

Where The D-AI-LY generated articles that could be validated against actual Statistics Canada bulletins, this was straight forward to do so. Mere replication is not an interesting demonstration. Where the value comes is from scalability and velocity, generating releases for data that has not yet been published as a release or perhaps never will be despite data series being updated. 

## Ghosts in the machine

These models are great at writing and executing code to do these things, but they are not great at validating data. Their obsequiousness to the user, tendency to satisfice, and human-like laziness compounds these errors. 

The issue with LLMs that they might:
- Invent plausible-looking numbers that aren't in the source data
- Confuse similar metrics (Bank Rate vs Policy Rate)
- Apply the wrong decimal place (0.04% becomes 0.4%) and make simple arithmetic errors
- Generate data for periods that haven't been released yet
- Fill in table cells with fabricated values when the real data isn't available

The danger is that fabricated data can look extremely real. Even an informed reader may have no way of knowing if the data is real or not unless the model comes up with something so farfetched or illogical that it triggers our immediate skepticism. 

So We're in the dangerzone here without any external ground truth to cheaply validate against. Careful human review is one way out, but it's not scalable, and instantly reduces the utility of a system like The D-AI-LY. 

This is a post about building systems to catch a model that's very good at lying convincingly.

There are two main elements here: 

1. Architecture-level solutions: structures and scripts that enforce each generated article to document, track, and verify the provenance of its data. This is more deterministic and less subject to LLM errors and tries to prevent the model from veering off into hallucinated data at every stage. 
2. Skill-based solutions: specific data and sanity checks that are invoked as part of the GENERATOR skill. We can think of it as a checklist against common (and previously encountered) failure modes. These are more reactive and leave room for the LLM to make subjective decisions about data. 

## Architecting Provenance Tracking

I call these layers, but they're more like handoff requirements and checkpoints along the way between data retrieval, article generation, and article publishing. 

* Layer 1: Data Acquisition with Validation (R)

All data has to be retrieved through a single R script `fetch_cansim_enhanced.R`. This script uses the `cansim` package's built-in CANSIM metadata functions to validate data quality at fetch time, including:
- **Freshness check**: Warns if data is more than 3 months old
- **Continuity check**: Detects gaps greater than 45 days in monthly series
- **Outlier detection**: Flags changes more than 3 standard deviations from the mean
- **Required fields**: Ensures VALUE, REF_DATE, and change calculations are present
- **Value ranges**: Domain-specific checks (e.g., CPI should be 50-300, MoM changes typically < ±10%)

A JSON file is generated for each retrievals to track data provenance recording exactly where the data came from: 

```json
{
  "provenance": {
    "table_number": "14-10-0005",
    "fetched_at": "2026-01-10 14:30:00 PST",
    "statcan_url": "https://www150.statcan.gc.ca/t1/tbl1/en/tv.action?pid=1410000501",
    "filters_applied": {
      "GEO": "Canada",
      "Type of claim": "Initial and renewal claims, seasonally adjusted"
    },
    "r_version": "4.5.0",
    "cansim_package_version": "0.4.4"
  }
}
```

This starts the audit trail: for any number in any generated article, we should be able to trace back to the exact table, filters, and timestamp of the fetch.

* Layer 2: JSON Verification Files

Every article uses a JSON verification file tracking the raw authoritative data in two formats.

**Enhanced format** for complex tables with multiple dimensions:
```json
{
  "metadata": {
    "table_number": "18-10-0004",
    "reference_period": "2025-11",
    "fetched_at": "2025-12-25 12:07:52"
  },
  "latest": {
    "value": 165.4,
    "yoy_pct_change": 2.22
  },
  "time_series": [...],
  "subseries": {...},
  "provincial": {...},
  "validation": {...}
}
```

**Simple format** for single-series indicators:
```json
{
  "series": "Manufacturing sales",
  "ref_date": "2025-10",
  "value": 71505434,
  "mom_pct": -1.0,
  "yoy_pct": 0.7,
  "time_series": [...],
  "provenance": {...}
}
```

These files serve as the single source of truth. Every number in an article must exist in its verification JSON.

* Layer 3: Article Frontmatter Declaration

Every article must declare which JSON file contains its source data:

```yaml
---
title: Consumer prices up 2.2% year over year in November 2025
verification_json: output/data_18_10_0004_enhanced.json
toc: false
---
```

We're continuing with the theme of a self-generated audit trail. For any generated article, we (or specifically the build process) should be able to quickly and easily identify the JSON file that backs it, with the full provenance chain back to the source data from Statistics Canada. 

* Layer 4: Build-Time Enforcement

Everytime the site is rebuilt with newly generated articles, the build process runs a validation check to ensure that all articles have a valid verification JSON file. Currently this checks all articles, but should probably be optimized to only check articles that have been modified since the last build. 

```json
{
  "scripts": {
    "build": "node scripts/validate-verification.js && observable build && node scripts/fix-paths.js"
  }
}
```

This will break deployment and prevent building if any article is missing a verification JSON file. 

```
Validating verification JSON for all articles...

Checked 122 articles
Valid: 122

✓ All articles have valid verification JSON
```

* Layer 5: Audit Tools

There's also a pair of audit validation scripts, one in R and one in Node.js. These more or less are a kind of test coverage, and duplicate the build-time enforcement, but are useful for ad-hoc audits. Admittedly this step is probably overkill and an example of Claude's occasional tendency to over-engineer.


## Skill-based solutions to weed out data gremlins 

Separate from the architecture layers, there's an operational checklist that is invoked as part of the GENERATOR skill. These are more like a checklist to verify against some persistent failure mores that came up. We can think of it as accumulated workflow learnings, encapsulated as part of the workflow documented in the skill.

```
### 1. Provenance Check
*Every number must have a source*

- [ ] Headline figure: cite JSON path (e.g., `latest.yoy_pct_change = 2.2`)
- [ ] Each chart data point: from `time_series[N].value`
- [ ] Each table cell: from `subseries[N]` or `provincial[N]`
- [ ] **If you cannot cite the source, do not include the number**

### 2. Arithmetic Verification
*Math must be exact*

- [ ] Recalculate YoY from time_series: `(current - year_ago) / year_ago × 100`
- [ ] Recalculate MoM from time_series: `(current - previous) / previous × 100`
- [ ] If trade data: verify `balance = exports - imports` exactly
- [ ] **If calculated value differs from claimed by >0.1pp, STOP and investigate**

### 3. Period Match Check
*Never generate data that doesn't exist*

- [ ] Article reference period ≤ JSON `metadata.reference_period`
- [ ] **If article period > JSON period, data doesn't exist - STOP**

### 4. Variation Check
*For batch generation of multiple months*

- [ ] Component values DIFFER across months generated
- [ ] Provincial values DIFFER across months generated
- [ ] **If values are identical across months, you're copying stale data - STOP**

### 5. Data Existence Check
*Don't fabricate breakdowns*

- [ ] Does `subseries[]` array exist and have entries? If empty, omit breakdown.
- [ ] Does `provincial[]` array exist and have entries? If empty, omit provincial table.
- [ ] Can you cite exact JSON path for EACH breakdown value?
```

## The D-AI-LY's Seven Golden Rules

Distilled from these failures, we now follow seven golden rules:

1. **Every number must trace to a real StatCan value.**
   No exceptions. No approximations. No placeholders.

2. **Read JSON before writing.**
   State the headline value explicitly before writing article text.

3. **Copy-paste, don't transcribe.**
   Memory errors cause decimal place mistakes and other drift.

4. **Article period ≤ JSON period.**
   Never generate for data that doesn't exist yet.

5. **Identical values across months = high likelihood of fabrication.**
   Real economic data has natural variation.

6. **If you can't calculate it, don't show it.**
   No percentages without both before and after values.

7. **Build must fail.**
   Enforcement through tooling, not documentation.

## A taxonomy of failure modes 

To understand why these strict layers and rules are necessary, let's take a look at the specific, sometimes subtle ways the LLM tried to lie to me. These data errors are particularly insidious specifically because they are hard to detect in an automated process.  

I highlighted a few examples from an audit I ran on some of The D-AI-LY's earlier article batches. It's a subset, and I have more examples in this [gist](https://gist.github.com/dshkol/4909777147936e1bb2292b4df6ee6a34) if anyone is interested.

```
### Failure Mode 1: Auxiliary Data Fabrication

**What happened:**
Backfill articles for Labour Force Survey had fabricated employment rate, participation rate, and full-time/part-time split values. The fabricated values weren't just slightly wrong - some were in the **opposite direction** from reality.

**How it was detected:**
- Time series data (unemployment rate, employment levels) were correct because they came from verified JSON sources
- But auxiliary indicators in summary tables were invented to fill gaps
- The fabrication pattern was suspiciously consistent: FT/PT splits always "mirrored" overall employment direction
- Real economic data is more nuanced - sometimes part-time rises while full-time falls

**Root cause:**
The generator derived or estimated values to complete summary tables, rather than fetching each value from Statistics Canada. Without enforcement, it was too easy to invent "plausible" numbers.

**Prevention implemented:**
- **Mandatory rule**: For every numeric value in an article - FETCH from StatCan, not derived, not estimated
- **Pre-publish checklist**: For each number in summary tables - Can I cite the specific vector/table?
- **Safe vs. unsafe backfill patterns**: Extending line charts backward (each point validated) is SAFE. Filling in auxiliary table values is UNSAFE.
- **Reference vectors documented** for LFS auxiliary indicators

---

### Failure Mode 3: Year-over-Year Calculation Errors

**What happened:**
GDP October 2025 article claimed +0.4% year-over-year growth, but the actual calculation from time_series data was +0.04% - a 10x error.

**The data:**
time_series: Oct 2024 = 2317.1B, Oct 2025 = 2318.0B
Correct YoY: (2318.0 - 2317.1) / 2317.1 × 100 = 0.039% ≈ 0.04%
Article incorrectly stated: 0.4%

**Root cause:**
Decimal place error when transcribing small percentage changes. The difference between 0.04% and 0.4% is enormous in economic terms - the former suggests stagnation, the latter suggests modest growth.

**Prevention implemented:**
- **Always cross-validate YoY** by manual calculation from time_series
- Be especially careful with small percentage changes (<1%)
- Double-check decimal places: 0.04% ≠ 0.4% ≠ 4%
- Copy-paste values from JSON, don't type from memory

---

### Failure Mode 4: Article Generated for Unreleased Period

**What happened:**
International trade article claimed to cover October 2025, but the JSON file only contained September 2025 data. October data wasn't released by Statistics Canada until January 8, 2026.

**The evidence:**
JSON reference_period: "2025-09"
JSON end_period: "2025-09"
JSON fetched_at: "2025-12-23"
Article claimed: October 2025
Official October release: 2026-01-08

**The result:**
Without real data, the LLM fabricated internally-consistent but completely wrong October figures:

| Metric | Fabricated Value | Actual Value (Jan 8 release) |
|--------|------------------|------------------------------|
| Exports | $64.2B (flat) | $65.6B (+2.1%) |
| Imports | $66.8B (+4.2%) | $66.2B (+3.4%) |
| Trade deficit | $2.6B | $583M |

**Critical insight:** Internally consistent ≠ externally accurate. The fabricated data formed a coherent narrative, but was completely wrong.

**Root cause:**
The article was requested for a period beyond what existed in the JSON. Without real data, the LLM invented plausible-looking values.

**Prevention implemented:**
- **NEVER generate articles for periods beyond `metadata.reference_period`**
- Before generating, verify: `article_period <= JSON.metadata.reference_period`
- If user requests future period, STOP and report: "Data not yet available"
- Check StatCan release schedule before attempting to generate

---

### Failure Mode 6: Hardcoded Plausible Values

**What happened:**
Articles were generated with numbers that looked reasonable but weren't from the fetched JSON data.

**Examples:**
- Interest rates article used 2.50% (the "Bank Rate") instead of 2.25% (the "Policy Rate" from JSON)
- Manufacturing capacity used 80.8% instead of actual 80.7% from JSON

The errors were small - close enough to seem right at a glance - but they were wrong.

**Root cause:**
1. JSON file wasn't read before generating article text
2. LLM used approximate values from training data instead of exact JSON values
3. Similar-sounding terms confused (Bank Rate ≠ Policy Rate)

**Prevention implemented:**
- **ALWAYS read JSON file before writing ANY numbers**
- **ALWAYS state headline value explicitly**: "The JSON shows X.X%"
- Copy-paste values from JSON, don't type from memory
- For financial data: verify exact terminology matches the JSON field name

---

### Failure Mode 7: Missing Verification JSON

**What happened:**
A verification audit found 32 articles without corresponding JSON verification files. During the audit, these articles couldn't be immediately validated because there was no saved data to compare against.

**Affected categories:**
Manufacturing, Food Services, IPPI, RMPI, Electricity, EI Claims, and others.

**The evidence:**
- Articles existed in `docs/en/`
- No JSON files in `output/` for these indicators
- Required manual re-fetch from CANSIM to verify article claims
- The data was correct (verified via re-fetch), but the audit trail was missing

**Root cause:**
Articles were generated using ad-hoc R fetches that didn't save JSON files. The workflow wasn't enforced.

**Prevention implemented:**
This failure led to the comprehensive verification JSON system described in this document:

1. **Every article MUST declare `verification_json` in frontmatter**
2. **Build fails** if `verification_json` is missing or file doesn't exist
3. **Single data fetching tool** (`fetch_cansim_enhanced.R`) that always saves JSON
4. **240 articles updated** with verification_json frontmatter
```

## You can't (yet) prompt your way out of this

Ideally none of this would be necessary. We should be able to prompt a model to "use real data, don't make anything up, don't mistakes" and leave it at that. People are building wildly impressive things with agentic LLMs but longer context empirical work reliably contains errors. We simply can't take our hands off the wheel yet and trust the output blindly. But for now, it looks like you have to design systems that make it harder for fabrication and mistakes to slip through undetected. 

At the time of this post, the D-AI-LY now has 120 or so articles with unbroken provenance chains back to Statistics Canada. Every number traces to a JSON file, every JSON file traces to a CANSIM table, and the build fails if any link is missing. It's probably over-engineered in some areas and under-engineered in others but this scaffolding makes it easier for me to trust the output. 



