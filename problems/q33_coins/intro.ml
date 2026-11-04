;; open Assert

(* Your job in this problem is to calculate the smallest number of
   pennies, nickels, dimes, and quarters that can be used to add up
   to a given total monetary value. For example, to make 7 cents, a
   total of 3 coins are needed (two pennies and a nickel). To make
   99 cents, 9 coins are needed (3 quarters, 2 dimes, and 4 pennies). *)

let rec coins (amount: int) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "coins: Fill in here!"

(* Here are a few test cases for this problem. Others will be supplied by
   the autograder. Feel free to add your own if you find it helpful. *)

(* To make 7 cents, we need a 1 nickel and 2 pennies, i.e., 3 coins *)
let test () : bool =
  (coins 7) = 3
;; run_test "coins nickels and pennies" test

(* To make 99 cents, we need 3 quarters, 2 dimes, 0 nickels, and 4 pennies. *)
let test () : bool =
  (coins 99) = 9
;; run_test "coins quarters, dimes, and pennies" test

let test () : bool =
 coins 1 = 1
;; run_test "coins 1" test

let test () : bool =
 coins 10 = 1
;; run_test "coins 10" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = coins 0 = 0
;; run_test "coins 0" test
let test () : bool = coins 25 = 1
;; run_test "coins 25" test
let test () : bool = coins 41 = 4
;; run_test "coins 41 (quarter, dime, nickel, penny)" test
