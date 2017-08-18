Title: Codecademy Portfolio
Date: 2015-04-11
Category: Web Development, Programming
Tags: javascript, ruby on rails, web development
Slug: codecademy_portfolio
Authors: Jesse Lumarie
Summary: A little [something](https://jesselumarie.com/blog/solving-a-boggle-board) to show of my work at Codecademy Labs: Offline.

For the past three months, I've been attending the Codecademy Labs: Offline course in Chicago through their partnership with Dev Bootcamp, [ReSkill USA][reskill-usa]. One of the final Ruby on Rails projects for the course involved creating a landing page that showcased our newly acquired web development skills. Having created a [landing page][mywebsite] of my own earlier in the course, I decided to flesh out the idea a little bit -- enter this little ditty:

[![Codecademy Projects](/blog/theme/images/site_content/codecademy_projects_screenshot.png)][codecademy-portfolio]

[Codecademyportfolio.jessefurmanek.com][codecademy-portfolio] is a rails app that shows off all of the sites and pseudo-sites[^1] that I created during my time at [Codecademy Labs: Offline][codecademy-labs]. Most of the sites are part of the Codecademy curriculum, a few come from tutorials around the web, and others still are sites that I created on my own. The app uses Rails to model, route, and display the website data, Heroku to serve it, and the JavaScript library [Shuffle.js][shuffle-js][^2] to create the shifting effect seen when selecting new filters.  

The code for all the sites listed in the portfolio (as well as the code for the [portfolio itself][github-portfolio]) are up on [Github][github], so feel free to take a look under the hood.


[^1]: A lot of the sites we created were front-end only, meaning, some of the buttons didn't do anything when you clicked them the links generally don't take you to new websites.

[^2]: Shuffle.js is a great filtering library that I plan on using in future projects.  Realitively well documented and easy to use -- you should check it [out][shuffle-js]!



[reskill-usa]: https://www.reskillusa.com/
[codecademy-labs]: https://classes.codecademy.com/
[mywebsite]: https://jesselumarie.com/
[codecademy-portfolio]: https://codecademyportfolio.jessefurmanek.com/
[shuffle-js]: https://vestride.github.io/Shuffle/
[github-portfolio]: https://github.com/jesselumarie/portfolio
[github]: https://github.com/jesselumarie
