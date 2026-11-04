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

type labeled_evtree =
  | LLeaf of helix
  | LNode of labeled_evtree * helix * labeled_evtree

let helix_of_evtree (t: labeled_evtree) : helix =
  begin match t with
    | LLeaf h -> h
    | LNode (_, h, _) -> h
  end

let rec guess_parent_helix (x1: helix) (x2: helix) : helix =
  begin match x1, x2 with
    | [], [] -> []
    | h1 :: t1, h2 :: t2 ->
      (if h1 = h2 then h1 else A) :: guess_parent_helix t1 t2
    | _ -> failwith "invalid input: x1 and x2 have unequal lengths"
  end

(* Now we want to use the guess_parent_helix function to fill in the
   guess the DNA of all the ancestor species in an evolutionary tree,
   given the DNA of their present-day descendants. *)

(* Given an unlabeled evtree, generate an evtree with the same shape
   but with all internal nodes properly labeled. Use
   guess_parent_helix to compute the appropriate label for a parent
   node, given the labels of its two children.

   Some points to remember...

   - Your function should work for an evtree of _any_ height.

   - You should NOT assume that all input trees are "balanced"; that
     is, the left and right sub-trees of any node may in general have
     different numbers of nodes!

   - Keep in mind: if you find yourself writing the same segment of code
     multiple times, that is often an indicator that that segment can be
     named for reuse in multiple places. This will also make your code
     run faster! :) *)

let rec add_ancestor_labels (t: evtree) : labeled_evtree =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "add_ancestor_labels: Fill in here!"

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  add_ancestor_labels (Node (
      Leaf [C; A; T],
      Node (
        Node (
          Leaf [C; G; T],
          Leaf [C; G; A]
        ),
        Leaf [C; T; A]
      )
    )) =
  LNode (
    LLeaf [C; A; T],
    [C; A; A],
    LNode (
      LNode (
        LLeaf [C; G; T],
        [C; G; A],
        LLeaf [C; G; A]
      ),
      [C; A; A],
      LLeaf [C; T; A]
    )
  )
;; run_test "add_ancestor_labels depth-3 evtree" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = add_ancestor_labels (Leaf [A]) = LLeaf [A]
;; run_test "add_ancestor_labels: single leaf" test
let test () : bool =
  add_ancestor_labels (Node (Leaf [G; T], Leaf [G; A]))
  = LNode (LLeaf [G; T], [G; A], LLeaf [G; A])
;; run_test "add_ancestor_labels: two leaves" test
