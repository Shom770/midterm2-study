(* ------------------------------------------------------------------ *)
(* sum_pairs *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [sum_pairs l] adds up each pair in [l], keeping the results in order.

     sum_pairs [(1, 2); (3, 4)] = [3; 7]
     sum_pairs [(5, -5)] = [0]
     sum_pairs [] = []
*)
let rec sum_pairs (l : (int * int) list) : int list =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: sum_pairs"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = sum_pairs [(1, 2); (3, 4)] = [3; 7]
;; run_test "sum_pairs: two pairs" test
let test () : bool = sum_pairs [(5, -5)] = [0]
;; run_test "sum_pairs: one pair" test
let test () : bool = sum_pairs [] = []
;; run_test "sum_pairs: empty" test
