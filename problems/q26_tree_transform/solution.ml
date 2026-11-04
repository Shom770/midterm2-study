(* ------------------------------------------------------------------ *)
(* tree_transform *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* The generic tree type from lecture. Leave this definition alone. *)
type 'a tree =
  | Empty
  | Node of 'a tree * 'a * 'a tree

(* [tree_transform f t] applies [f] to every label of [t], returning a
   tree of the same shape.

     tree_transform (fun (x : int) -> x * 2)
                    (Node (Node (Empty, 1, Empty), 2, Node (Empty, 3, Empty)))
       = Node (Node (Empty, 2, Empty), 4, Node (Empty, 6, Empty))
*)
let rec tree_transform (f : 'a -> 'b) (t : 'a tree) : 'b tree =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: tree_transform"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = tree_transform string_of_int Empty = Empty
;; run_test "tree_transform: empty" test
let test () : bool =
  tree_transform (fun (x : int) -> x * 2)
    (Node (Node (Empty, 1, Empty), 2, Node (Empty, 3, Empty)))
  = Node (Node (Empty, 2, Empty), 4, Node (Empty, 6, Empty))
;; run_test "tree_transform: doubling" test
let test () : bool =
  tree_transform (fun (x : int) -> x > 1) (Node (Empty, 1, Node (Empty, 2, Empty)))
  = Node (Empty, false, Node (Empty, true, Empty))
;; run_test "tree_transform: change of type" test
