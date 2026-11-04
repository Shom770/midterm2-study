;; open Assert

module BSTSet : SetInterface.SET = struct

  ;; open Tree

  (* Tree is tree.ml from earlier in this homework. It defines

       type 'a tree =
         | Empty
         | Node of 'a tree * 'a * 'a tree

     and the BST functions inorder and insert used below. *)

  type 'a set = 'a tree

  let rec size (s: 'a set) : int =
    (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
    failwith "BSTSet.size: Fill in here!"

  (* ----------------------------------------------------------------
     Everything from here to the end of the module is provided for testing.
     You don't need to read or change any of it.
     ---------------------------------------------------------------- *)

  let empty : 'a set = Empty

  let is_empty (s: 'a set) : bool =
    failwith "Omitted (not relevant to this question)"

  let rec list_of_set (s: 'a set) : 'a list =
    inorder s

  let add (x: 'a) (s: 'a set) : 'a set =
    insert x s

  let remove (x: 'a) (s: 'a set) : 'a set =
    failwith "Omitted (not relevant to this question)"

  let member (x: 'a) (s: 'a set) : bool =
    failwith "Omitted (not relevant to this question)"

  let equals (s: 'a set) (t: 'a set) : bool =
    failwith "Omitted (not relevant to this question)"

  let set_of_list (l: 'a list) : 'a set =
    tree_of_list l

end

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  BSTSet.size (BSTSet.set_of_list [5; 2; 8; 2; 1]) = 4
;; run_test "BSTSet.size: list with a repeated element" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = BSTSet.size BSTSet.empty = 0
;; run_test "BSTSet.size: empty" test
let test () : bool = BSTSet.size (BSTSet.set_of_list [1; 2; 3; 5]) = 4
;; run_test "BSTSet.size: four elements" test
let test () : bool = BSTSet.size (BSTSet.set_of_list [1; 2; 1; 1]) = 2
;; run_test "BSTSet.size: duplicates collapse" test
