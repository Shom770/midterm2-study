(* ------------------------------------------------------------------ *)
(* double_all *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [double_all l] doubles every element of [l], keeping the order.

     double_all [1; 2; 3] = [2; 4; 6]
     double_all [-2; 0] = [-4; 0]
     double_all [] = []
*)
let rec double_all (l : int list) : int list =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: double_all"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = double_all [1; 2; 3] = [2; 4; 6]
;; run_test "double_all: positives" test
let test () : bool = double_all [-2; 0] = [-4; 0]
;; run_test "double_all: negative and zero" test
let test () : bool = double_all [] = []
;; run_test "double_all: empty" test
