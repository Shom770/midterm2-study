(* ------------------------------------------------------------------ *)
(* product *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [product l] is the product of all the elements of [l].

     product [2; 3; 4] = 24
     product [5] = 5
     product [1; 0; 7] = 0
     product [] = 1
*)
let rec product (l : int list) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: product"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = product [2; 3; 4] = 24
;; run_test "product: three elements" test
let test () : bool = product [5] = 5
;; run_test "product: one element" test
let test () : bool = product [1; 0; 7] = 0
;; run_test "product: contains zero" test
let test () : bool = product [] = 1
;; run_test "product: empty list is 1" test
