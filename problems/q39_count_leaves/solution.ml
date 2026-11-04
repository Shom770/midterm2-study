(* ------------------------------------------------------------------ *)
(* count_leaves *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* The binary tree type from lecture. Leave this definition alone. *)
type tree =
  | Empty
  | Node of tree * int * tree

(* [count_leaves t] counts the leaves of [t]: the Nodes whose subtrees
   are both Empty. The empty tree has no leaves.

     count_leaves Empty = 0
     count_leaves (Node (Empty, 7, Empty)) = 1
*)
let rec count_leaves (t : tree) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: count_leaves"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = count_leaves Empty = 0
;; run_test "count_leaves: empty" test
let test () : bool = count_leaves (Node (Empty, 7, Empty)) = 1
;; run_test "count_leaves: single node" test
let test () : bool =
  count_leaves (Node (Node (Empty, 1, Empty), 3,
                      Node (Empty, 2, Node (Empty, 4, Empty)))) = 2
;; run_test "count_leaves: nodes with one child are not leaves" test
