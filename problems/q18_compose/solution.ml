(* ------------------------------------------------------------------ *)
(* compose *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* [compose f g x] applies [g] to [x] and then [f] to the result.

     compose (fun (x : int) -> x + 1) (fun (x : int) -> x * 2) 5 = 11

   Note the order: g runs first, f second.
*)
let compose (f : 'b -> 'c) (g : 'a -> 'b) (x : 'a) : 'c =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: compose"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let add1 (x : int) : int = x + 1
let double (x : int) : int = x * 2
let test () : bool = compose add1 double 5 = 11
;; run_test "compose: double first, then add1" test
let test () : bool = compose double add1 5 = 12
;; run_test "compose: add1 first, then double" test
let test () : bool = compose string_of_int add1 41 = "42"
;; run_test "compose: change of type" test
