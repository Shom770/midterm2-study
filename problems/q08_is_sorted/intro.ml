;; open Assert

(* Write a function that determines whether a given list of integers
   is sorted in ascending order -- that is, whether each element is less
   than or equal to the element immediately after it in the list.

   A sorted list may have repeated elements, so long as they are next
   to each other. Lists containing zero or one elements are
   considered sorted. *)

let rec is_sorted (l: int list) : bool =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "is_sorted: Fill in here!"

let test () : bool =
  (is_sorted [1; 2; 3])
;; run_test "is_sorted sorted list" test

let test () : bool =
  not (is_sorted [3; 2; 1])
;; run_test "is_sorted unsorted list" test

let test () : bool =
 is_sorted []
;; run_test "is_sorted empty list" test

let test () : bool =
 is_sorted [1]
;; run_test "is_sorted singleton" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = is_sorted [1; 1; 2]
;; run_test "is_sorted: repeated elements" test
let test () : bool = not (is_sorted [1; 3; 2])
;; run_test "is_sorted: out of order at the end" test
