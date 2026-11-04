;; open Assert

(* Here is the definition of the datatype of generic binary trees from class. *)
type 'a tree =
  | Empty
  | Node of 'a tree * 'a * 'a tree

(* Next, let's define a "perfect" binary tree as one where
      - every leaf is the same distance from the root, and
      - every node has either 0 or 2 children.

   For example, this is a perfect tree:

           19
         /    \
       52      16
      /  \    /  \
     5    2  4    1

   Write a function `is_perfect` that tests whether a tree is perfect.

   Hint: you'll probably want to write a helper function -- e.g., one that
   calculates the height of a tree. *)

let rec is_perfect (t: 'a tree) : bool =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "Tree.is_perfect: Fill in here!"

(* ------------------------------------------------------------------
   Everything below this line is provided. You don't need to read
   or change any of it (apart from the example test at the very
   end, which is there for you to run and extend).
   ------------------------------------------------------------------ *)

let leaf x = Node (Empty, x, Empty)

(* Here are some unit test cases. Others will be supplied by the autograder.
   Feel free to add your own if you find it helpful -- including some where the
   tree being tested is _not_ perfect! *)

let test () : bool =
  is_perfect Empty
;; run_test "is_perfect: empty tree returns true" test

let test () : bool =
  is_perfect (leaf 6)
;; run_test "is_perfect: leaf returns true" test

let test () : bool =
  let ex_tree = Node (Node (leaf 5, 52, leaf 2),
    19, Node (leaf 4, 16, leaf 1)) in
  is_perfect ex_tree
;; run_test "is_perfect: perfect multi-level tree returns true" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = not (is_perfect (Node (leaf 1, 2, Empty)))
;; run_test "is_perfect: one child" test
let test () : bool = not (is_perfect (Node (leaf 1, 2, Node (leaf 3, 4, leaf 5))))
;; run_test "is_perfect: leaves at different depths" test
let test () : bool = is_perfect (Node (leaf 1, 2, leaf 3))
;; run_test "is_perfect: three nodes" test
