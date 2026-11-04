;; open Assert

(* Write a function that takes two integer lists (not necessarily
   sorted) and returns true precisely when the first list is a sublist
   of the second -- that is, when the first list appears,
   contiguously, anywhere within the second. See the test cases for
   examples.

   HINT: You will probably want to define (and perhaps test!) a helper
   function to make the main `sublist` function easier. *)

let rec sublist (l1: int list) (l2: int list) : bool =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "sublist: Fill in here!"

let test () : bool =
  (sublist [] [])
;; run_test "sublist two empty lists" test

let test () : bool =
  (sublist [] [1;2;3;4])
;; run_test "sublist one empty list" test

let test () : bool =
  (sublist [2;3] [1;2;3])
;; run_test "sublist is a sublist" test

let test () : bool =
  (sublist [2;3] [2;4;2;3])
;; run_test "sublist after a false start" test

let test () : bool =
  not (sublist [2;3] [2;1;3])
;; run_test "sublist elements are not contiguous" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = not (sublist [1] [])
;; run_test "sublist: nonempty in empty" test
let test () : bool = sublist [1; 2; 1] [1; 1; 2; 1]
;; run_test "sublist: overlapping false start" test
