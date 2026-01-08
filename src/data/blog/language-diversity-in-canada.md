---
title: "Language Diversity in Canada"
author: Dmitry Shkolnik
pubDatetime: 2017-10-03T00:00:00.000Z
description: "A look into linguistic diversity patterns in Canadian cities"
tags:
  - cancensus
  - census
  - maps
slug: language-diversity-in-canada
categories:
  - analysis
  - blog
  - census
---

<center>
![The Confusion of Tongues, Gustav Doré, engraving c.1865-1868](https://upload.wikimedia.org/wikipedia/commons/a/af/Confusion_of_Tongues.png){ height=30% }
_The Confusion of Tongues, Gustav Doré, engraving c.1865-1868_
</center>



## Language Diversity Index

The Language Diversity Index is a quantitative measure of the diversity of languages found in a given area. In a country like Canada with two official languages, a rich history of diverse Aboriginal languages, and a long history of immigration from a wide range of countries and ethno-linguistic cultures, we would expect to see a relatively high score for linguistic diversity. 

According to a [ranking by UNESCO](http://unesdoc.unesco.org/images/0018/001852/185202E.pdf), as of 2009 Canada ranked 79th in linguistic diversity. While this seems quite low, among OECD countries, only Belgium (47th), Israel (58th), Norway (60th), Latvia (68th), and Italy (69th) ranked higher. The United States, by comparison, ranked 116th. Portugal (186th) and South Korea (199th) ranked near the bottom. North Korea was ranked last.

But what if we focused on Canadian cities rather than the country level. The majority of immigrants and international migrants end up in a handful of Canada's largest cities. A number of [media stories](http://www.bbc.co.uk/programmes/p03v1r1p) have surfaced in recent years declaring Toronto the world's most diverse city. Is this also the case when it comes to linguistic diversity? How does Toronto compare to other Canadian cities? The good news is we now have access to the latest Census data for languages spoken at home and mother tongues, so let's take a look. 

#### Calculating a Language Diversity Index

Greenberg (1956) [introduced](https://www.jstor.org/stable/410659?seq=1#page_scan_tab_contents) a quantitative measurement for language diversity. The *Language Diversity Index* calculates the probability that any two speakers in a population will speak the same language. 

Greenberg's Language Diversity Index (LDI) can be calculated with simple formula where:

$$ 
LDI = 1 - \Sigma (P_i)^2
$$
A higher resulting LDI measure indicates greater linguistic diversity. A score of 1 would imply that no two individuals share a language. Greenberg illustrates how to calculate this with a simple example. If in a population $1/8$ speak $M$, $3/8$ speak $N$, and $1/2$ speak $O$, then the diversity index would be calculated as: 

$$
\begin{split}
LDI = 1 - \bigg[\big(\frac{1}{8}\big)^2 + \big(\frac{3}{8}\big)^2 + \big(\frac{1}{2}\big)^2\bigg] \\ = 1-\frac{26}{64} = \frac{38}{64} \approx 0.593
\end{split}
$$

As an aside, the competition economists in the audience will notice that Greenberg's language diversity index is calculated in the same fashion as the [Herfindahl-Hirschman Index](https://en.wikipedia.org/wiki/Herfindahl_index) for measuring market concentration and competition. The same approach is used in the [Simpson Index](https://en.wikipedia.org/wiki/Diversity_index#Simpson_index) of ecological diversity.

#### The data

The 2016 Census draws distinction between mother tongue and language spoke most often at home. As we're interested in language diversity as a proxy for population diversity, the analysis in this document relies on data for mother tongue. Data for mother tongue is further divided into data for individuals providing a single response and for individuals providing multiple responses. The data for multiple languages spoken at home is only separate into broad groupings of "English and French", "English and non-official language", "French and non-official language", and "English, French and non-official language". This complicates things a bit when it comes to calculating linguistic diversity. I get into this a bit more in the appendix at the end for those who are interested.

Census data is retrieved using the R package [cancensus](https://github.com/mountainmath/cancensus) developed by [Jens von Bergmann](https://twitter.com/vb_jens), [Aaron Jacobs](https://github.com/atheriel), and [myself](https://twitter.com/dshkol). The `cancensus` package functions as an interface to the [CensusMapper API](https://censusmapper.ca/api) to Statistics Canada's Census data which was also developed by Jens.

Languages are an area where the Canadian Census program really shines. Languages are organized within a deeply nested hierarchy. As an example, Ojibway-Potawatomi languages are a subset of Blackfoot languages which are a subset of Algonquian languages which are a subset of Aboriginal languages which then fall within the Non-official languages subset. This type of data can be described as a hierarchical tree where the final level of disaggregation within each branch is called a leaf. In total there are over 200 such leaves in the language spoken at home data. 

Fortunately, `cancensus` provides several helper functions to search through vectors and make sense of these hierarchies. 

## What are Canada's most linguistically diverse metropolitan areas ?

I posted this is a question on Twitter last week. There were not that many responses, but the majority of responses picked Toronto. 

```r
blogdown::shortcode("tweet",913822688996597760)
```

Were these people correct? 

####  Getting the Data

By taking advantage of the built-in variable (vector) search and selection tools in `cancensus`, selecting all language leaves can be done in just a few lines of code. 

```r
# Search for the census vector for aggregated language spoken at home
language_total <- search_census_vectors("Language spoken most often", dataset) %>% 
  filter(vector == "v_CA16_1355") 

# Select all leaf nodes of this vector. The parameter TRUE returns only the finite leaves among child nodes. 
language_children <- language_total %>%
  child_census_vectors(TRUE) 

# We'll need the aggregated total for our calculations so let's append them together
language_vectors <- bind_rows(language_total, language_children) %>%
  pull(vector)
```

Similarly, the built-in functions to search for, identify, and extract regions makes selecting geography a breeze. 

```r
# Select region codes for the 10 largest CMAs by population
regions_list10 <- list_census_regions(dataset) %>% 
  filter(level=="CMA") %>% 
  top_n(10,pop) %>% 
  as_census_region_list
```


```r
# Get census data
langs_cma <- get_census(dataset, level = "CMA", regions = regions_list10, vectors = language_vectors, geo_format = NA, labels = "short")
```

#### A function to calculate language diversity

The function below takes a Census data frame including the language vectors and generates a summarized table with the LDI for each region. 

```r

# Key variables
# v_CA16_1355 - total
# v_CA16_2150 - English + French
# v_CA16_2153 - English + other
# v_CA16_2156 - French + other
# v_CA16_2159 - English + French + other
# v_CA16_1364 - English only
# v_CA16_1367 - French only

ldi_calc <- function(df) {
  tidy_langs <- df %>%
  rename(`Language Total` = v_CA16_1355) %>%
  mutate(v_CA16_1364 = v_CA16_1364 + v_CA16_2153 + v_CA16_2150 + v_CA16_2159,
         v_CA16_1367 = v_CA16_1367 + v_CA16_2156 + v_CA16_2150 + v_CA16_2159) %>%
  select(-v_CA16_2153, -v_CA16_2150, -v_CA16_2159, -v_CA16_2156) %>%
  tidyr::gather(key = language, value = lang_count, v_CA16_1364:v_CA16_1937) %>%
  mutate(ldi_frac = ifelse(lang_count <= `Language Total`, lang_count/`Language Total`, 1)) %>%
  group_by(GeoUID) %>%
  mutate(ldi = 1 - sum((ldi_frac)^2)) %>%
  ungroup() %>%
  select(-language, -lang_count, -ldi_frac) %>%
  distinct()
  return(tidy_langs)
}
```

Now that the diversity indices for each of our top-10 CMAs are calculated, let's visualize how they compare to one another. I like to use `geom_lollipop` from the [ggalt](https://github.com/hrbrmstr/ggalt) package to arrange and compare indicators.

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/cma_ldi_plot-1.png)

Ottawa-Gatineau, not Toronto, is the most linguistically diverse _Census metropolitan areas_ in Canada based on Greenberg's Language Diversity Index. Montréal comes second, and Toronto and Vancouver round out the top-4. This is a surprising result, but it may make more sense when you think about the structure of these metropolitan areas. 

Canadian Census metropolitan areas are specially-defined geographic groupings that represent urban agglomeration of Census subdivisions. The standard subprovincial level of Census geography are Census divisions and Census subdivisions. The Census subdivision level is probably the best way to compare municipalities within metro areas across different metro areas. 

A metropolitan area includes multiple municipalities, townships and other municipal-level administrative regions. A large CMA may have some areas with extremely high linguistic diversity and other areas with much lower diversity that bring the overall diversity score down for that metropolitan area. We can check this out by computing a diversity score for each individual CSD within our top-10 CMAs and visualizing in a way that we can see how distributions differ for each CMA. A [beeswarm](https://github.com/eclarke/ggbeeswarm) plot is an effective way to represent this type of data.

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/cma_variance-1.png)

This explains things better. While Ottawa has the highest score at the CMA level, Montréal, Toronto, and Vancouver have numerous individual Census subdivisions that are more diverse than anything in Ottawa-Gatineau. However, they also have relatively many low diversity areas that bring down the overall diversity index score at the CMA level. The bubbles in the above plot scale with CSD population and they further show Toronto and Vancouver have a number of high diversity areas of larger populations, which helps explain why most people expected either one of these two CMAs to rank the highest. Which begs the question: what are the most diverse municipalities in Canada? 

#### Linguistic diversity of municipalities

Loading the data for Census subdivisions follows the same approach as before. 

```r

# Select region codes for the 50 largest Census Divisions in Canada by population
csd50_list <- list_census_regions(dataset) %>% 
  filter(level=="CSD") %>% 
  top_n(50,pop) %>% 
  as_census_region_list

# Query data
langs_csd50 <- get_census(dataset, level = "CSD", regions = csd50_list, vectors = language_vectors, geo_format = NA, labels = "short")

# Calculate index
csd50_ldi <- ldi_calc(langs_csd50) %>%
  mutate(`Region Name` = as.factor(gsub(" \\(.*\\)","",`Region Name`)))
```

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/csd_lollipop-1.png)

Out of the top 50 largest CSDs in Canada, Richmond, British Columbia ends up scoring the highest on our diversity index. As a Richmond native, this is a somewhat surprising result. While Richmond consistently has one of the lowest English/French speaking shares, the general perception is that Richmond is still linguistically homogeneous with most people speaking a handful of non-official languages. 

Brossard and Mont-Royal in Montréal have higher index scores but they do not make the cut for the 50 most populous CSDs. Richmond Hill and Markham stand out in the GTA, while Burnaby and, to a lesser extent, Surrey and Coquitlam score highly in the Lower Mainland. 

The Quebec municipalities of Trois-Rivières, Lévis, and Saguenay are by the far the least diverse populous Census subdivisions. 

#### Linguistic Diversity and Population

Is there a relationship between population size and linguistic diversity? Let's take a look at the linguistic diversity of the 100 largest CSDs.

```r
# Get census data
csd100_list <- list_census_regions(dataset) %>% 
  filter(level=="CSD") %>% 
  top_n(100,pop) %>% 
  as_census_region_list

# Query data
langs_csd100 <- get_census(dataset, level = "CSD", regions = csd100_list, vectors = language_vectors, geo_format = NA, labels = "short")

# Calculate index
csd100_ldi <- ldi_calc(langs_csd100) %>%
  mutate(`Region Name` = as.factor(gsub(" \\(.*\\)","",`Region Name`)))
```

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/csd_lang_plot1-1.png)

Due to the wide range in population among CSDs a logarithmic scale for the population axis is probably more appropriate to use here.

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/csd_plot2-1.png)

There appears to be a log-linear relationship between population and language diversity. This makes intuitive sense but the causal relationship is not clear and is beyond the scope of this simple data exploration piece. Linguistic diversity is likely associated with immigration, and immigrants are not uniformly distributed across the country, rather they are concentrated in a handful of larger cities. 

We can fit a simple linear model with `geom_smooth(...)` to see what that relationship looks like.

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/csd_plot3-1.png)

## Linguistic diversity within Cities

The `cancensus` package can simultaneously query and retrieve Census geographic data and return spatial data objects of either `sf` or `sp` class. This allows for spatial representation of Census data. In other words: maps on maps on maps. 

Let's take a look at Canada's three largest metropolitan areas. With `cancensus` we can query up to the Dissemination Area (DA) level of Census geography which allows for much greater resolution into the spatial distribution of something like language diversity. 

```r
regions_list_van <- list_census_regions(dataset) %>% 
  filter(level=="CMA", name == "Vancouver") %>% 
  as_census_region_list

regions_list_tor <- list_census_regions(dataset) %>% 
  filter(level=="CMA", name == "Toronto") %>% 
  as_census_region_list

regions_list_mtl <- list_census_regions(dataset) %>% 
  filter(level=="CMA", name == "Montréal") %>% 
  as_census_region_list

regions_list_ott <- list_census_regions(dataset) %>% 
  filter(level=="CMA", name == "Ottawa - Gatineau") %>% 
  as_census_region_list
```
These are large queries that may take some time and burn through your API rate limit, so use with caution. Fortunately cancensus caches data upon download so we don't have to keep downloading it over and over again for the same queries.

We can make maps using `ggplot2` which works well with `sf`-class objects _in theory_. The reality is that `sf` is still very much a developing standard for spatial data and the corresponding ggplot `geom_sf` is only available (as of writing) in the [development version](https://github.com/tidyverse/ggplot2) of `ggplot2` which can be downloaded by running `devtools::install_github("tidyverse/ggplot2")`.

#### Greater Vancouver CMA

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/city_maps_van-1.png)

And the same process can be used for the other cities.

#### Greater Toronto CMA

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/city_maps_tor-1.png)

#### Montreal CMA

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/city_maps_mtl-1.png)

#### Ottawa - Gatineau

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/city_maps_ott-1.png)

#### Vancouver in Detail

Taking a look at Vancouver in more detail we can focus specifically on Vancouver (including UBC and the University Endowment Lands), Burnaby, Richmond, and New Westminster to identify the most linguistically diverse parts of those municipalities.

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/van_detail-1.png)

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/van_detail-2.png)

### Appendix: Single Response vs Multiple Response

Census variables for the language spoken most commonly at home are separated into two types of responses. The majority of responses are classified as "Single Responses" where a respondent indicated exclusively one language on their response. Alternatively, respondents are able to select one of four additional options: "English and French", "English and non-official language", "French and non-official language", or "English, French, and non-official language". These are categorized under the Multiple Response hierarchy and are separated from the rest of the responses. This obviously complicates calculating language diversity -- how do you accurately calculate diversity using the data in the Multiple Response category when it does not have the same level of detail as the Single Response data. 

We can do some testing of the data within this category to better understand what is their likely impact on the diversity index score.

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/mr_testing-1.png)

The share of respondents selecting the Multiple Response option differs across the top 10 CMAs with Toronto at one end with 9.5% of respondents and Quebec City at the other end with only 1.4% of respondents falling into the Multiple Response group. 

The objective of this analysis is less on quantifying the exact linguistic diversity of each area but more to see the relative diversity across different areas. In other words - which parts of Canada are the most linguistically diverse. In order to think about how this additional data affects the diversity index, a closer look at how these data points break down is required.

![](/post/2017-10-02-language-diversity-in-canada_files/figure-html/mr_testing_detail-1.png)

There is a relatively consistent share of English/French and non-official language respondents, so its not clear that including or excluding these respondents would have any effect on the relative diversity in those cities. Similarly, Quebec City has such a small share of respondents falling into this category that it is next to meaningless to worry about it. Where it may pose a challenge is with the relatively large share of English + French respondents in Montréal and Ottawa - Gatineau. Because those two languages are already the dominant languages in both those areas, excluding data for the Multiple Responses set would have the effect of shrinking true denominator for the diversity index and overstating the impact of all other languages, leading to potentially inflated diversity score. Similarly, including Multiple Response data points into the index as distinct linguistic groups would also inflate the diversity score by double counting some English or French speakers as speaking a distinct language from other English or French speakers. 

My proposed solution to address the Single Response/Multiple Response issue is the following: 

* _English and non-official language_ respondents are added to the Single Response _English_ speakers
* _French and non-official language_ speakers are added to the Single Response _French_ speakers
* _English and French_ speakers along with _English and French and non-official languages_ speakers are added to both the Single Response _English_ and the Single Response _French_ speakers 
* The denominator for the diversity index is the sum of Single Response totals and Multiple Responses totals

Identifying the exact impact on the diversity score will be very challenging so I leave that exercise to anyone who wants to follow up on this analysis. As usual, all the code for this page and the analysis on it as available on [Github](https://github.com/dshkol/scratchpad/blob/master/content/post/2017-10-02-language-diversity-in-canada.Rmd).