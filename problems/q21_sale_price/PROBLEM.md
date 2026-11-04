# Question 21: sale_price

File: `solution.ml`

```
sale_price
A store records all its prices in cents, as ints, exactly as the movie
theater example in lecture did.
Write

sale_price : int -> int -> int

so that sale_price price percent_off is the price in cents after taking
percent_off percent off price. The discount is

(price * percent_off) / 100

using integer division (so a fraction of a cent is dropped), and the sale price
is price minus that discount.

sale_price 1000 25 = 750 (* discount 250 *)
sale_price 999 10 = 900 (* discount 9990 / 100 = 99 *)
sale_price 5 50 = 3 (* discount 250 / 100 = 2 *)
sale_price 100 0 = 100

Watch the order of the operations: dividing before multiplying gives a very
different answer.
```
