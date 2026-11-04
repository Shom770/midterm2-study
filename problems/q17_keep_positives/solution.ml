(* ------------------------------------------------------------------ *)
(* keep_positives *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [keep_positives l] returns the strictly positive elements of [l],
   in their original order. Zero is not positive.

     keep_positives [3; -1; 0; 7] = [3; 7]
     keep_positives [-2; -5] = []
     keep_positives [] = []
*)
let rec keep_positives (l : int list) : int list =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: keep_positives"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = keep_positives [3; -1; 0; 7] = [3; 7]
;; run_test "keep_positives: mixed" test
let test () : bool = keep_positives [-2; -5] = []
;; run_test "keep_positives: none" test
let test () : bool = keep_positives [] = []
;; run_test "keep_positives: empty" test
