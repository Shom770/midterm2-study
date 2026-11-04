# Question 18: compose

File: `solution.ml`

```
compose
In lecture, we saw that functions can be passed as arguments (twice, filter) and
returned as results (make_incr). This function does both at once.
Write:

compose : ('b -> 'c) -> ('a -> 'b) -> 'a -> 'c

let add1 (x : int) : int = x + 1
let double (x : int) : int = x * 2

compose add1 double 5 = 11 (* double first: 10, then add1 *)
compose double add1 5 = 12 (* add1 first: 6, then double *)
compose string_of_int add1 41 = "42"
```
