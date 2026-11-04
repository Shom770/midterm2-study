;; open Assert

(* Design and implement a function called `rainfall` that consumes a
   list of ints representing daily rainfall readings. The list may
   also contain the number -999, indicating the end of the data of
   interest. There may also be negative numbers other than -999 in the
   list; these represent faulty readings and should be skipped.

   Produce the average of the non-negative values in the list up to
   and including the one just before the first -999 (if any). If you
   cannot compute an average, for whatever reason, your function
   should return -1. *)

let rainfall (readings: int list) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "rainfall: Fill in here!"

(* For example, if we have readings [1; 2; 3], then the average
   rainfall is (1 + 2 + 3) / 3 = 6/3 = 2. *)
let test () : bool =
  rainfall [1; 2; 3] = 2
;; run_test "example" test

(* NOTE: For simplicity, you should only use int operations in this
   problem, even though this may lead to slightly wrong answers, since
   integer division discards the fractional part of its result instead
   of rounding. *)

let test () : bool =
  rainfall [2; 2; 2; 2; 1] = 1
;; run_test "use integer division to calculate average" test

let test () : bool =
 rainfall [-999] = -1
;; run_test "rainfall -999 only" test

let test () : bool =
 rainfall [1; -999; 15] = 1
;; run_test "rainfall -999 in middle of list" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = rainfall [2; -2; 2; -999; 4] = 2
;; run_test "rainfall: faulty reading and data after -999" test
let test () : bool = rainfall [-2; -3] = -1
;; run_test "rainfall: only faulty readings" test
let test () : bool = rainfall [] = -1
;; run_test "rainfall: empty" test
