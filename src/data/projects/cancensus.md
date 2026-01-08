---
title: "cancensus"
description: "R package for accessing Canadian Census data directly from Statistics Canada's API"
type: "r-package"
featured: true
startDate: 2017-01-01
tags: ["R", "Census", "Statistics Canada", "API"]
links:
  github: "https://github.com/mountainMath/cancensus"
  docs: "https://mountainmath.github.io/cancensus/"
  cran: "https://cran.r-project.org/package=cancensus"
---

cancensus is an R package that provides programmatic access to Canadian Census data through the CensusMapper API. It enables researchers, analysts, and journalists to easily retrieve and work with census data at various geographic levels.

## Features

- Access to multiple census years (2006-2021)
- Retrieval at various geographic levels (CMA, CD, CT, DA, etc.)
- Built-in caching for efficient data retrieval
- Seamless integration with sf for spatial analysis
- Vector and hierarchical variable lookups

## Example

```r
library(cancensus)

# Get population data for Vancouver CMAs
vancouver_pop <- get_census(
  dataset = "CA21",
  regions = list(CMA = "59933"),
  vectors = c("v_CA21_1"),
  level = "CT"
)
```

The package is co-maintained with Jens von Bergmann and is widely used in Canadian demographic research and journalism.
