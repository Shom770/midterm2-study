;; open Assert

(* Here is the definition of the datatype of generic binary trees from class. *)
type 'a tree =
  | Empty
  | Node of 'a tree * 'a * 'a tree

(* Recall that a binary search tree is a binary tree that follows some
   additional invariants:

   - `Empty` is a binary search tree, and
   - `Node (lt, v, rt)` is a binary search tree if both
     - `lt` is a binary search tree, and every value in `lt` is less than `v`
     - `rt` is a binary search tree, and every value in `rt` is greater than
       `v` *)

(* The `delete` function returns a tree that is like `t` except with the
   element `x` removed. If `x` is not present, the resulting tree is the
   same `t`. *)

let rec delete (x: 'a) (t: 'a tree) : 'a tree =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "Tree.delete: Fill in here!"

(* ------------------------------------------------------------------
   Everything below this line is provided. You don't need to read
   or change any of it (apart from the example test at the very
   end, which is there for you to run and extend).
   ------------------------------------------------------------------ *)

let leaf x = Node (Empty, x, Empty)

(* Here are some simple unit tests for delete. Others will be supplied by
   the autograder. Feel free to add your own if you find it helpful. *)

let rec lookup (x: 'a) (t: 'a tree) : bool =
  begin match t with
  | Empty -> false
  | Node (lt, v, rt) -> v = x || if x < v then lookup x lt else lookup x rt
  end

let rec inorder (t: 'a tree) : 'a list =
  begin match t with
  | Empty -> []
  | Node (lt, v, rt) ->
     inorder lt @ [v] @ inorder rt
  end

let rec insert (x: 'a) (t: 'a tree) : 'a tree =
  begin match t with
  | Empty -> leaf x
  | Node (lt, v, rt) ->
      if x < v then Node (insert x lt, v, rt)
      else if x > v then Node (lt, v, insert x rt)
      else t
  end

let tree_leaf5 : int tree = leaf 5

let tree_balanced : int tree =
  Node (leaf 2, 5, leaf 7)

let tree_left_skewed : int tree =
  Node (Node (leaf 1, 2, Empty), 3, Empty)

let tree_int_inputs : (int tree * int) list = [
  (Empty, 1);
  (tree_leaf5, 5);
  (tree_leaf5, 3);
  (tree_leaf5, 7);
  (tree_balanced, 2);
  (tree_balanced, 6);
  (tree_balanced, 1);
  (tree_balanced, 9);
  (tree_left_skewed, 2);
  (tree_left_skewed, 0);
]

let tree_two_int_inputs : (int tree * int * int) list = [
  (Empty, 1, 2);
  (tree_leaf5, 5, 3);
  (tree_leaf5, 3, 5);
  (tree_balanced, 2, 7);
  (tree_balanced, 2, 2);
  (tree_balanced, 6, 1);
  (tree_left_skewed, 1, 4);
]

(* A property-based test of `delete`, using `lookup`. `test_property_on` runs
   the property once per input and reports each as its own unit test. *)

let property ((t, x) : int tree * int) : bool =
  not (lookup x (delete x t))

;; test_property_on "delete" property tree_int_inputs

(* Two METAMORPHIC properties relating `insert` and `delete`. Metamorphic
   properties check relationships between different series of operations.

   Property 1: If we delete an element `x` and then insert the same element
   `x`, the values in the tree should be the same as simply inserting the
   element `x` into the original tree. *)

let property ((t, x) : int tree * int) : bool =
  inorder (insert x (delete x t)) = inorder (insert x t)

;; test_property_on "delete then insert same element" property tree_int_inputs

(* Property 2: If we delete an element `d` and then insert a *different*
   element `i`, the values in the tree should be the same as inserting `i`
   then deleting `d` -- the order of the two operations doesn't matter. *)

let property ((t, d, i) : int tree * int * int) : bool =
    (* Skip when they're the same - that's tested above *)
    d = i || inorder (insert i (delete d t)) = inorder (delete d (insert i t))

;; test_property_on
   "delete then insert different element" property tree_two_int_inputs

let test () : bool =
  delete 3 Empty = Empty
;; run_test "delete: empty" test

let test () : bool =
  delete 2 (Node (leaf 2, 5, leaf 7)) =
    Node (Empty, 5, leaf 7)
;; run_test "delete: element in tree" test

let test () : bool =
  let t = (Node (leaf 2, 5, leaf 7)) in
  delete 1 t = t
;; run_test "delete: element not in tree" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool =
  let t = delete 5 (Node (leaf 2, 5, leaf 7)) in
  inorder t = [2; 7]
;; run_test "delete: root with two children" test
let test () : bool =
  let t = Node (Node (leaf 1, 2, leaf 3), 5, Node (leaf 6, 8, leaf 9)) in
  inorder (delete 8 t) = [1; 2; 3; 5; 6; 9]
  && inorder (delete 2 t) = [1; 3; 5; 6; 8; 9]
;; run_test "delete: inner nodes with two children" test
