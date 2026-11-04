(* ------------------------------------------------------------------ *)
(* contains_zero *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [contains_zero l] is true exactly when 0 appears somewhere in [l].

     contains_zero [1; 0; 2] = true
     contains_zero [1; 2; 3] = false
     contains_zero [] = false
*)
let rec contains_zero (l : int list) : bool =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: contains_zero"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = contains_zero [1; 0; 2]
;; run_test "contains_zero: zero in the middle" test
let test () : bool = not (contains_zero [1; 2; 3])
;; run_test "contains_zero: no zero" test
let test () : bool = not (contains_zero [])
;; run_test "contains_zero: empty list" test
let test () : bool = contains_zero [5; 6; 0]
;; run_test "contains_zero: zero at the end" test
