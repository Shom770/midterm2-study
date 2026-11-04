(* ------------------------------------------------------------------ *)
(* is_bst *)
(* *)
(* Implement the function below, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* The binary tree type from lecture. Leave this definition alone. *)
type tree =
  | Empty
  | Node of tree * int * tree

(* The in-order traversal from lecture. Provided for your convenience;
   you are free to use it or not. *)
let rec inorder (t : tree) : int list =
  begin match t with
  | Empty -> []
  | Node (lt, x, rt) -> inorder lt @ [ x ] @ inorder rt
  end

(* [is_bst t] is true exactly when t satisfies the BST invariant:
   Empty is a BST, and Node (lt, x, rt) is a BST when lt and rt are
   BSTs, EVERY label in lt is < x, and EVERY label in rt is > x.

   The inequalities are strict, so a repeated label means false.

     is_bst (Node (Node (Empty, 1, Empty), 5, Node (Empty, 9, Empty))) = true
     is_bst (Node (Node (Empty, 9, Empty), 5, Node (Empty, 1, Empty))) = false
*)
let is_bst (t : tree) : bool =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: is_bst"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = is_bst Empty
;; run_test "is_bst: empty" test
let test () : bool = is_bst (Node (Node (Empty, 1, Empty), 5, Node (Empty, 9, Empty)))
;; run_test "is_bst: small valid tree" test
let test () : bool = not (is_bst (Node (Node (Empty, 9, Empty), 5, Node (Empty, 1, Empty))))
;; run_test "is_bst: children swapped" test
let test () : bool = not (is_bst (Node (Node (Empty, 5, Empty), 5, Empty)))
;; run_test "is_bst: repeated label" test
let test () : bool =
  not (is_bst (Node (Node (Empty, 1, Node (Empty, 9, Empty)), 5, Empty)))
;; run_test "is_bst: deep violation (9 left of 5)" test
