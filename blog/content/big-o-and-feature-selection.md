Title: Big-O Notation and Feature Selection
Date: 2015-03-13
Category: Machine Learning, Programming
Tags: programming, machine-learning
Slug: big-o-and-feature-selection
Authors: Jesse Furmanek
Summary: [Exponents](http://jessefurmanek.com/blog/big-o-and-feature-selection.html) are stronger than you.

Some problems are computationally intractable-- while we know how to program a computer to solve a problem, the computer (or array of computers) would take so much time[^1] that calculating the answer wouldn't be worth it. One of these intractable problems is finding all subsets of a large group, as I recently found out when I [completed][udacity-github] the intro to machine learning course offered by [Udacity][udacity-class].  

For the final project, students attempted to predict whether an individual was a person of interest in the Enron scandal based on characteristics of the [Enron email corpus][enron-corpus] (a giant file containing about 600,000 emails sent by Enron employees), as well as basic employee characteristics (or features), shown below:

	financial features: ['salary', 'deferral_payments', 'total_payments', 'loan_advances','bonus', 'restricted_stock_deferred', 'deferred_income', 'total_stock_value', 'expenses', 'exercised_stock_options', 'other', 'long_term_incentive', 'restricted_stock', 'director_fees']

	email features: ['to_messages', 'email_address', 'from_poi_to_this_person', 'from_messages','from_this_person_to_poi', 'poi', 'shared_receipt_with_poi'] 

These features correspond with a flag (or label) which indicates whether that employee was a person of interest (POI). During the course, we used decision tree[^2] and random forest classifying algorithms for many of our classification problems, so I decided to use these algorithms for the final project.  

To keep the model simple, I only used the employee features (leaving the Enron corpus for another day).  Rather than throwing all of the features into an decision tree or random forests implementation (which in this case leads to poor classifier performance), I tried to select the features that yielded the highest combination of recall and precision.

In machine learning, feature selection is self-explanatory-- it's the process of selecting features for your model.  What isn't clear, however, is the best method of feature selection.  As someone pretty new to the machine learning, I chose a method which seemed pretty clever at the time, but turned out to be only somewhat useful and not at all scalable.

Twenty features didn't seem like a very large number, small enough that I could iterate through every subset and find the best combination of features. Subsets represent the different ways you can choose items of a particular set[^3].  For example, there are four subsets in the set {A, B}:

* { }  choosing nothing at all[^4]
* { A }  just choosing A
* { B }  just choosing B
* { A, B } choosing both A & B

Figuring out the number of subsets from a set of two items is easy enough-- computing all possible combinations of a set of twenty features is not, and that leads me to Big-O notation.

Big-O notation is a way of classifying an algorithm's processing time as the input for that algorithm increases in size. Say you had an algorithm that took a list of names, and sorted them in alphabetical order.  All algorithms take time to run[^5].  The results of running this name-sorting algorithm on an increasing numbers of names would look something like this:

<table>
    <tr>
        <td><u>Number of Names</u></td>
				<td><u>Time to Compute</u></td>
    </tr>
    <tr>
        <td>1</td>
				<td>1 seconds</td>
    </tr>
    <tr>
        <td>10</td>
				<td>100 seconds</td>
    </tr>
    <tr>
        <td>100</td>
				<td>10,000 seconds</td>
    </tr>
</table>

The time it takes the sorting algorithm to run is the square of the number of name inputs.  In Big-O notation, the algorithm would be said to run in O(n<sup>2</sup>), or quadratic time.  There are a number of [common algorithm complexities][wiki-time-complexity], the most simple being constant time, often written as O(1).  An example of constant time would be accessing a single item of an array using its index value (this is because the computer only needs a single instruction to execute this operation, regardless of the instruction's "size")[^6].  Finding all subsets of a given set, unfortunately, falls on the opposite end of the time-complexity spectrum.

What happens if you try to compute the number subsets at the same rate as we did for sorting names?

<table>
    <tr>
        <td><u>Number of Items in a Set</u></td>
				<td><u>Number of Subsets</u></td>
    </tr>
    <tr>
        <td>1</td>
				<td>2 subsets</td>
    </tr>
    <tr>
        <td>10</td>
				<td>1,024 subsets</td>
    </tr>
    <tr>
        <td>100</td>
				<td>1.26 x 10^30 subsets</td>
    </tr>
</table>

Yikes[^7].  Finding the number of subsets of a given set ends up returning very large numbers very fast, at an exponential rate in fact.  This type of complexity is known unceremoniously as exponential time, and is written as O(2<sup>n</sup>).

You'll note that I didn't use a time unit for the subset.  Even if the algorithm took no time to compute, it would still need to return the resulting subsets somehow, which in itself would take time.  In the impossible situation of a algorithm with zero time cost, an algorithm with O(2<sup>n</sup>) is nonetheless computationally intractable, as the number of items returned is so big that it would take an exponentially longer time run on larger sets.

Let's bring it back to feature selection.  While I wanted sort through all twenty features and choose the best combination, this just wasn't possible given the computational complexity of finding subsets. So what did I do?

I used a combination of intuition and testing to get the universe of features down to a reasonable number (twelve, which still took awhile to run), and the ran the subset algorithm from there.  I chose features by measuring the recall and precision that resulted after removing features which appeared unhelpful on their face, as well as by looking at the 'feature_importances_' attribute of sklearn's implementation of [random forests][sk-learn].

While this is not ideal [^8], I ended up with some okay results[^9] and a practical lesson in alogrithm complexity and Big-O Notation: respect the exponent and its power(s).



[^1]: Certain types of encryption fall into this category. In the case of AES-256 encryption, too long is greater than the [age of the universe] [universe-age].
[^2]: Every time I think of decision trees, I think of [these][ents] guys.
[^3]: Check out [mathisfun.com][math-is-fun] for more information about sets and subsets.
[^4]: Called an 'empty set'.
[^5]: [Citation needed](http://xkcd.com/285/).
[^6]: [Wikipedia][wiki-time-complexity] offers a pretty great explanation of the various time complexities.
[^7]: That escalated <del>quickly</del> exponentially.
[^8]: Since completing the project, I learned that sklearn actually offers [tools][sk-learn-RFE] that can be used to pare down features recursively-- perhaps I'll explore those in another post.
[^9]: Precision: 0.59184	Recall: 0.52200	 (we were shooting for better than .30 for both)



[udacity-github]: https://github.com/jessefurmanek/udacity_coursework/tree/master/intro_to_machine_learning/final_project
[udacity-class]: https://www.udacity.com/course/ud120
[enron-corpus]: http://en.wikipedia.org/wiki/Enron_Corpus
[ents]: http://www.dailymotion.com/video/xmp51o_slow-decision-making-from-the-lord-of-the-rings-the-two-towers-2002_shortfilms
[universe-age]: http://www.eetimes.com/document.asp?doc_id=1279619
[wiki-time-complexity]: http://en.wikipedia.org/wiki/Time_complexity
[math-is-fun]: http://www.mathsisfun.com/sets/sets-introduction.html
[sk-learn]: http://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestClassifier.html
[sk-learn-RFE]: http://scikit-learn.org/stable/modules/generated/sklearn.feature_selection.RFE.html#sklearn.feature_selection.RFE

