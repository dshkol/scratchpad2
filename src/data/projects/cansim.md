---
title: "cansim"
description: "R package for accessing Statistics Canada data tables"
type: "r-package"
featured: true
startDate: 2018-01-01
tags: ["R", "Statistics Canada", "API", "Data"]
links:
  github: "https://github.com/mountainMath/cansim"
  docs: "https://mountainmath.github.io/cansim/"
  cran: "https://cran.r-project.org/package=cansim"
---

cansim provides easy access to Statistics Canada data tables (formerly known as CANSIM) directly from R. It handles the complexity of the Statistics Canada API and returns clean, analysis-ready data frames.

## Features

- Access to all Statistics Canada data tables
- Automatic handling of metadata and variable labels
- Built-in caching for efficient data retrieval
- Support for both NDM and legacy CANSIM table numbers
- Automatic normalization of data values

## Example

```r
library(cansim)

# Get Consumer Price Index data
cpi_data <- get_cansim("18-10-0004-01")

# Get specific vectors
inflation <- get_cansim_vector("v41690973", start_time = "2020-01-01")
```

The package is co-maintained with Jens von Bergmann and is essential for anyone working with Canadian statistical data.
