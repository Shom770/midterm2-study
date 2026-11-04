(* ------------------------------------------------------------------ *)
(* sum_first_two *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [sum_first_two l] is the sum of the first two elements of [l], or of
   however many there are if [l] is shorter than two.

     sum_first_two [3; 4; 5] = 7
     sum_first_two [3; 4] = 7
     sum_first_two [7] = 7
     sum_first_two [] = 0

   This function is not recursive.
*)
let sum_first_two (l : int list) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: sum_first_two"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = sum_first_two [3; 4; 5] = 7
;; run_test "sum_first_two: only the first two" test
let test () : bool = sum_first_two [3; 4] = 7
;; run_test "sum_first_two: exactly two" test
let test () : bool = sum_first_two [7] = 7
;; run_test "sum_first_two: one element" test
let test () : bool = sum_first_two [] = 0
;; run_test "sum_first_two: empty" test
