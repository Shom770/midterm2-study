(* ------------------------------------------------------------------ *)
(* count_negatives *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [count_negatives l] is the number of elements of [l] that are strictly
   less than zero.

     count_negatives [1; -2; 3; -4] = 2
     count_negatives [1; 2; 3] = 0
     count_negatives [0] = 0
     count_negatives [] = 0
*)
let rec count_negatives (l : int list) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: count_negatives"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = count_negatives [1; -2; 3; -4] = 2
;; run_test "count_negatives: mixed" test
let test () : bool = count_negatives [1; 2; 3] = 0
;; run_test "count_negatives: none" test
let test () : bool = count_negatives [0] = 0
;; run_test "count_negatives: zero is not negative" test
let test () : bool = count_negatives [] = 0
;; run_test "count_negatives: empty" test
