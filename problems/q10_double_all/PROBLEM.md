# Question 10: double_all

File: `solution.ml`

```
double_all
Write

double_all : int list -> int list

which doubles every element of the list, keeping the elements in the same
order.

double_all [1; 2; 3] = [2; 4; 6]
double_all [-2; 0] = [-4; 0]
double_all [] = []

Follow the structural recursion pattern: one branch for [] and one for
hd :: rest. The inductive case builds a new list with ::, using the
recursive result for rest.
```
