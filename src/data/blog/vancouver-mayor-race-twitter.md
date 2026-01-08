---
title: "A look at the Vancouver mayoral race twitter picture"
author: Dmitry Shkolnik
pubDatetime: 2018-10-01T00:00:00.000Z
description: "Using Twitter data and NLP tools to look at the timelines of the six most prominent candidates for Mayor of Vancouver"
tags:
  - politics
  - nlp
  - r
  - twitter
  - vancouver
slug: vancouver-mayor-race-twitter
categories:
  - blog
  - analysis
---

> (Updated October 16, 2018) With the election coming up in the next week and this page getting more traffic, I decided to do a quick refresh of the data used in this post up to and including October 15. Changes are relatively few, and as this site is a github repo, can be tracked via commits to this post. 

### The 2018 Municipal Election in Vancouver

On October 20, a relatively small portion of Vancouverites will vote to elect a mayor, 10 city councillors, 7 park board commissioners and 9 school trustees. Municipal elections do not receive the fanfare or attention of federal or provincial elections and see lower turnouts, but they are an important determinant towards the policies that affect the everyday lives of city residents. 

With 21 candidates for Mayor and 77 candidates for Council, there's a lot to parse through. The City of Vancouver provides [candidate profiles](https://vancouver.ca/your-government/candidate-profiles.aspx), and most of the candidates and parties who are likely to receive the most votes have already released their platforms. 

While there are certainly a number of interesting and unique independent candidates looking to run for Mayor, all existing polling suggests that there are six candidates with a realistic shot at being elected: Kennedy Stewart (Independent), Ken Sim (NPA), Shauna Sylvester (Independent), Hector Bremner (Yes Vancouver), David Chen (ProVancouver), and Wai Young (CoalitionVan).

### Mayor Twitter 

Campaign financing reforms introduced prior to this election have meant that there is less money available to campaigns, and, therefore, less promotion and advertising of candidates ahead of the election. Recent elections around the world have demonstrated, for better or worse, the effectiveness of social media platforms like Twitter in raising candidate profiles and bringing out supporters. All six top mayoral candidates are relatively active on Twitter, and appear to have increased their online participation with the election drawing nearer. Fortunately, Twitter is the best platform for analysis with it's public facing content, relatively generous public APIs, and a number of excellent tools developed to extract and work with tweet data. 

### Highlights and caveats

There's a few key takeaways from this post that I want to highlight here:

* Until we have election results, Twitter performance is not indicative or predictive of anything in this race, but it is an interesting way to look at things. 
* Twitter engagement does not necessarily mean much on its own as it can reflect engagement with a built-in and captive audience, especially when it comes to messages using specific hashtags. 
* That said, all things considered, as a candidate you would like to see an increasing trend in tweet engagement. 
* Shauna Sylvester is trending in the right direction but has a long ways to go to match Kennedy Stewart's overall numbers. 
* Bremner and Sim need to tweet more, if only so that there's more of a text corpus to analyze. 
* Unfortunately the Twitter API makes it challenging to get the number of replies to a given tweet so we are unable to calculate "ratio" for all of the thousands of posts by the six candidates, but we'll always have this one from Wai Young.
`r blogdown::shortcode('tweet', '1037388282286419968')`

![](/post/2018-10-01-a-look-at-the-vancouver-mayor-twitter-picture_files/figure-html/volume-1.png)

Of the six, Chen has been the most active tweeter since April 2018 with 2943 tweets, more than three and five times as many as the next prolific tweeters in Sylvester and Stewart, respectively. Bremner, Sim, and Young, in comparison are much less active tweeters, but all appear to have increased their tweeting as the election draws closer. 

### Engagement trends

We can measure visible engagement by adding up the number of retweets and favourites to look how those tweets are performing, but its not always indicative. A viral bad tweet (see above) will have a huge audience and will inevitably see more visible engagement as someone, somewhere, will find something they like in any opinion. Measuring the engagement rate of tweets requires knowledge about the audience size and reach of each tweet, which is not something available publicly, so this is an imprecise measurement, but it can serve as a proxy for audience growth.

![](/post/2018-10-01-a-look-at-the-vancouver-mayor-twitter-picture_files/figure-html/engagement-1.png)

### Changing sentiments

Sentiment analysis of Twitter data is a well-traversed form of [analysis](http://www.cs.columbia.edu/~julia/papers/Agarwaletal11.pdf). Briefly, sentiment analysis relies on algorithms that work existing natural language corpuses to estimate the positive or negative score value of words and sentences. The sentiment of a tweet is estimated by adding up the sentiment scores of the individual words within that tweet. A higher score suggests a more positive sentiment. These sentiment scores are useful as a quick meta analysis of the high-level approach each candidate takes in composing their tweets.

![](/post/2018-10-01-a-look-at-the-vancouver-mayor-twitter-picture_files/figure-html/sentiment1-1.png)

While all candidates have tweets classified as positive and negative, it is Chen who is the candidate who appears to rely the most on negative sentiment tweets. 

Both positive and negative messaging are viable approaches to political messaging and revealed trends in tweet sentiment can help inform of us which way candidates appear to be focusing their messaging as the election draws closer.

![](/post/2018-10-01-a-look-at-the-vancouver-mayor-twitter-picture_files/figure-html/sentiment2-1.png)

There are some well-documented weaknesses in estimating sentiment of human speech. For example, the majority of sentiment lexicons would classify both "bad" and "ass" as words contributing to a negative sentiment, not knowing that "bad ass" actually has a positive connotation. There are ways around this with more sophisticated [n-gram](https://en.wikipedia.org/wiki/N-gram) based sentiment approaches, but this sentiment analysis approaches do not account for this. 

### Tweet text characteristics

Text is structured data with recurring patterns that are typically unique to a person. Even within the confines of 140 or 280 characters, the idiosyncratic linguistic patterns of different tweeters will often show up. The last few years have seen the development of numerous powerful and adaptable tools and libraries for natural language processing (NLP) in R that make it straight-forward to do analysis of large bodies of text at scale. We can use these tools to see if there are distinct patterns in how these six candidate use language on Twitter, and, further down, what kind of language they use.

![](/post/2018-10-01-a-look-at-the-vancouver-mayor-twitter-picture_files/figure-html/features-1.png)

We already saw earlier that Chen's tweets are, on average, the most negative and Sim's were the most positive. But it is also interesting to see that Chen stands out in a number of other ways as well. His tweets are the longest, the most verbose, the most likely to mention other users, and the most likely to take the third person perspective ("they"). Wai Young likes hashtags and exclamation marks the way Bremner likes commas. While both Stewart and Sylvester are running as independents, the former appears to be far more likely to adopt the first-person perspective in their tweets.

### Tweet language differences

Individual words or word-like components can be extracted from any text corpus, such as tweets, using a process called [tokenization](https://nlp.stanford.edu/IR-book/html/htmledition/tokenization-1.html). Again, with the NLP tools at our disposal nowadays, this is straight-forward and is further aided by the existence of Twitter specific [token-parsers](http://www.cs.cmu.edu/~ark/TweetNLP/) lexicons of common stop-words that are not interesting for analysis ("it", "the", etc.). This is less of an issue with mayoral candidates who are more likely than the average Twitter user to post in standard English, but it allows for generalization of this process to other Twitter users who may use non-standard English terms ("smh", "wtf", ":)", etc.).

![](/post/2018-10-01-a-look-at-the-vancouver-mayor-twitter-picture_files/figure-html/text1-1.png)

Token analysis of the candidates' tweets shows a fair bit of similarity: _Vancouver_, _city_, _people_ regularly appearing as the most frequently used words by almost all candidates. Other differences do appear between candidates, however. Consider Sim's emphasis on _team_, Bremner's _hope_ ... and _prior(?)_, Chen's _tax_ and _money_, and Young's _bike_. Both Stewart and Sylvester really emphasis _housing_ in their tweets, as well as Chen to a lesser extent. 

As this text comes from tweets, we can combine it those tweets' engagement numbers to see if any of these words are more likely to lead to likes than other words for each candidate.

![](/post/2018-10-01-a-look-at-the-vancouver-mayor-twitter-picture_files/figure-html/text2-1.png)

A few things immediately stand out that should be obvious to anyone who has paid attention to this race to this point: Stewart's audience cares about the coast and his plan to fight the Kinder Morgan pipeline expansion. Sylvester's audience cares about the Broadway Millennium Line extension. Young's tweets about bike lanes appear to particularly resonate, Sim is earning engagement for being Sim and not for what he tweets, and Bremner needs to tweet more so that his data can be quantitatively meaningful. 

> (Oct.16) Update: not too many changes here with the exception of Sylvester who appears to have greater amounts of positive engagements for her recent "leadership"-focused posts. This coincides with a significant increase in the average number of engagements for Sylvester's posts but it's not obvious whether there is a causal relationship there. 

### A note on data and tools

Putting together the analysis in this post takes a lot less time than it looks like thanks to several highly useful R libraries that do most of the heavy lifting here. Tweets for each candidates' timeline were extracted using the Twitter API and the [rtweet](https://rtweet.info/) package. Sentiment analysis was performed using the [syuzhet](https://cran.r-project.org/package=syuzhet) package, while text feature characteristics were extracted using the aptly named [textfeatures](https://cran.r-project.org/package=textfeatures) package. Finally, words and tokens were extracted from text using the [tidytext](https://cran.r-project.org/package=tidytext) package. The authors of that package have an excellent textbook with instructions and examples that can be viewed for free at https://www.tidytextmining.com. 

As usual, the code for data retrieval, data processing, and for the visuals in this post is available on [Github](https://github.com/dshkol/scratchpad/tree/master/content/post).