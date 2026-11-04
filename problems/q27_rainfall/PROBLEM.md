# Question 27: rainfall

File: `intro.ml`

```
Homework 1, Problem 13: rainfall
Below is an excerpt of intro.ml from Homework 1. The body of rainfall
has been replaced by failwith. Fill it in.
rainfall readings takes a list of daily rainfall readings and returns the
average of the valid ones, computed with integer division. Reading the list
from the front, stop at the first -999, which marks the end of the data of
interest (everything after it is ignored). Any other negative number is a
faulty reading and should be skipped. If there is nothing to average -- the
list is empty, begins with -999, or contains only faulty readings -- return
-1.

rainfall [1; 2; 3] = 2
rainfall [2; -2; 2; -999; 4] = 2
rainfall [-2; -3] = -1
```
