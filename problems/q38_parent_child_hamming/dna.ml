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

let rec hamming_distance (x1: helix) (x2: helix) : int =
  begin match x1, x2 with
    | [], _ -> 0
    | _, [] -> 0
    | h1 :: t1, h2 :: t2 -> hamming_distance t1 t2 + (if h1 = h2 then 0 else 1)
  end

type labeled_evtree =
  | LLeaf of helix
  | LNode of labeled_evtree * helix * labeled_evtree

let helix_of_evtree (t: labeled_evtree) : helix =
  begin match t with
    | LLeaf h -> h
    | LNode (_, h, _) -> h
  end

(* Now we want to compare the labeled_evtrees by
   calculating their "complexity" and then choosing the simplest /
   most plausible one. We measure the complexity of an evtree by summing
   the number of mutations needed to convert between its parent and
   child DNA sequences. *)

(* Given a labeled evtree, compute the sum of Hamming distances between
   all parent-child pairs (where "parent-child pair" refers to a
   DIRECT parent-child relationship, not just an ancestor relationship).

   Your solution should use the hamming_distance function above.
   Make sure to check what arguments hamming_distance requires. *)

let rec parent_child_hamming (t: labeled_evtree) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "parent_child_hamming: Fill in here!"

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  parent_child_hamming
    (LNode (LLeaf [G; T], [A; T], LNode (LLeaf [T; T], [T; T], LLeaf [C; G])))
  = 4
;; run_test "parent_child_hamming depth-3 evtree" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = parent_child_hamming (LLeaf [A]) = 0
;; run_test "parent_child_hamming: single leaf" test
