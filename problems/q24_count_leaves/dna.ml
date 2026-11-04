;; open Assert

(* The types of nucleotides and helices. (In the homework these are defined
   in helices.ml; the `= Helices.nucleotide` below just says that this is the
   same type as the one defined there.) *)
type nucleotide = Helices.nucleotide =
  | G (* guanine *)
  | C (* cytosine *)
  | A (* adenine *)
  | T (* thymine *)

type helix = nucleotide list

(* An evolutionary tree. *)
type evtree =
  | Leaf of helix
  | Node of evtree * evtree

let rec count_leaves (t: evtree) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "count_leaves: Fill in here!"

(* ------------------------------------------------------------------
   Everything below this line is provided. You don't need to read
   or change any of it (apart from the example test at the very
   end, which is there for you to run and extend).
   ------------------------------------------------------------------ *)

(* (Helices.white_cheeked_gibbon, etc., are long helices -- real DNA data --
   defined in helices.ml.) *)
let lesser_apes () : evtree =
  Node (
    Leaf Helices.white_cheeked_gibbon,
    Node (
      Leaf Helices.siamang,
      Node (
        Leaf Helices.lar_gibbon,
        Leaf Helices.pileated_gibbon
      )
    )
  )

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  count_leaves (lesser_apes ()) = 4
;; run_test "count_leaves lesser_apes" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = count_leaves (Leaf []) = 1
;; run_test "count_leaves: single leaf" test
let test () : bool = count_leaves (Node (Node (Leaf [], Leaf []), Leaf [])) = 3
;; run_test "count_leaves: unbalanced tree" test
