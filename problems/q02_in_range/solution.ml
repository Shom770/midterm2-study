(* ------------------------------------------------------------------ *)
(* in_range *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [in_range lo hi x] is true exactly when [x] lies between [lo] and [hi],
   including both endpoints.

     in_range 1 10 5 = true
     in_range 1 10 1 = true
     in_range 1 10 11 = false
     in_range 10 1 5 = false
*)
let in_range (lo : int) (hi : int) (x : int) : bool =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: in_range"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = in_range 1 10 5
;; run_test "in_range: inside" test
let test () : bool = in_range 1 10 1 && in_range 1 10 10
;; run_test "in_range: endpoints count" test
let test () : bool = not (in_range 1 10 11) && not (in_range 1 10 0)
;; run_test "in_range: outside" test
let test () : bool = not (in_range 10 1 5)
;; run_test "in_range: empty range" test
