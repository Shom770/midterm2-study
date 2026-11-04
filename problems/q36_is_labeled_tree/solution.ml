(* ------------------------------------------------------------------ *)
(* is_labeled_tree *)
(* *)
(* Implement the function at the bottom, then click Save & Grade. *)
(* ------------------------------------------------------------------ *)

(* The generic binary tree type from lecture and HW3. Leave it alone. *)
type 'a tree =
  | Empty
  | Node of 'a tree * 'a * 'a tree

(* The labelled tree type from HW2, made generic. It has no Empty:
   a node has either zero children (LLeaf) or two (LNode). *)
type 'a labeled_tree =
  | LLeaf of 'a
  | LNode of 'a labeled_tree * 'a * 'a labeled_tree

(* Provided: translates a tree into a labeled_tree of the same shape.
   Note that it FAILS on some inputs. *)
let rec to_labeled_tree (t : 'a tree) : 'a labeled_tree =
  begin match t with
  | Empty -> failwith "No empty labeled_tree"
  | Node (Empty, x, Empty) -> LLeaf x
  | Node (l, x, r) -> LNode (to_labeled_tree l, x, to_labeled_tree r)
  end

(* [is_labeled_tree t] is true exactly when [to_labeled_tree t] succeeds.

   That is: true when every node of t has either two Empty children or
   two non-Empty children, and false otherwise (in particular, false on
   Empty itself).

     is_labeled_tree Empty = false
     is_labeled_tree (Node (Empty, 1, Empty)) = true
     is_labeled_tree (Node (Node (Empty, 1, Empty), 2, Empty)) = false
*)
let rec is_labeled_tree (t : 'a tree) : bool =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "TODO: is_labeled_tree"

(* ---- Extra tests from the problem statement ---- *)
;; open Assert

let test () : bool = not (is_labeled_tree Empty)
;; run_test "is_labeled_tree: Empty" test
let test () : bool = is_labeled_tree (Node (Empty, 1, Empty))
;; run_test "is_labeled_tree: single node" test
let test () : bool = not (is_labeled_tree (Node (Node (Empty, 1, Empty), 2, Empty)))
;; run_test "is_labeled_tree: one child" test
let test () : bool =
  is_labeled_tree (Node (Node (Empty, 1, Empty), 2, Node (Empty, 3, Empty)))
;; run_test "is_labeled_tree: two leaves" test
