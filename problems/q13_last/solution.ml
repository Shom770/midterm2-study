(* ------------------------------------------------------------------ *)
(* last *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [last l] returns the last element of [l]. On the empty list it
   calls exactly: failwith "empty"

     last [1; 2; 3] = 3
     last [5] = 5
     last [] (* raises Failure "empty" *)
*)
let rec last (l : int list) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: last"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = last [1; 2; 3] = 3
;; run_test "last: three elements" test
let test () : bool = last [5] = 5
;; run_test "last: one element" test
let test () : bool =
  (try ignore (last []); false with Failure msg -> msg = "empty")
;; run_test "last: empty list fails with \"empty\"" test
