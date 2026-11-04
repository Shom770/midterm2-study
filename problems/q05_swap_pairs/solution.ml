(* ------------------------------------------------------------------ *)
(* swap_pairs *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [swap_pairs l] turns each pair in [l] around, keeping the order of the
   list.

     swap_pairs [(1, "a"); (2, "b")] = [("a", 1); ("b", 2)]
     swap_pairs [(7, "x")] = [("x", 7)]
     swap_pairs [] = []
*)
let rec swap_pairs (l : (int * string) list) : (string * int) list =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: swap_pairs"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = swap_pairs [(1, "a"); (2, "b")] = [("a", 1); ("b", 2)]
;; run_test "swap_pairs: two pairs" test
let test () : bool = swap_pairs [(7, "x")] = [("x", 7)]
;; run_test "swap_pairs: one pair" test
let test () : bool = swap_pairs [] = []
;; run_test "swap_pairs: empty" test
