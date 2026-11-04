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

let rec parent_child_hamming (t: labeled_evtree) : int =
  begin match t with
    | LLeaf _ -> 0
    | LNode (left, x, right) ->
      let ham1 = hamming_distance x (helix_of_evtree left) in
      let ham2 = hamming_distance x (helix_of_evtree right) in
      ham1 + ham2 + parent_child_hamming left + parent_child_hamming right
  end

(* Given a list of labeled evtrees, we want
   to find the simplest one in the list, using the
   parent_child_hamming function defined above to estimate the
   complexity of the evtree.

   The simplest_evtree function should, given a list of labeled_evtrees,
   return both the simplest evtree in the list and its complexity. If
   you find two simplest evtrees -- i.e., two evtrees that both have the
   lowest complexity -- return the one that appears first in the list.

   Remember that evtree A is considered simpler than evtree B if the
   complexity of A is less than the complexity of B.

   You can assume that this function will only be applied to a
   non-empty list of labeled_evtrees. Your function should throw an
   error (using failwith) if it is passed an empty list. *)

let rec simplest_evtree (ts: labeled_evtree list) : labeled_evtree * int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "simplest_evtree: Fill in here!"

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  let t1 = LNode (LLeaf [A], [T], LLeaf [C]) in
  let t2 = LNode (
               LLeaf [G; T],
               [A; T],
               LNode (
                   LLeaf [T; T],
                   [T; T],
                   LLeaf [C; G]
               )
           ) in
  simplest_evtree [t2; t1] = (t1, 2)
;; run_test "simplest_evtree two evtree list" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool =
  let t1 = LNode (LLeaf [A], [T], LLeaf [C]) in
  simplest_evtree [t1; LLeaf [A]] = (LLeaf [A], 0)
;; run_test "simplest_evtree: leaf is simplest" test
let test () : bool =
  let t1 = LNode (LLeaf [A], [T], LLeaf [C]) in
  let t3 = LNode (LLeaf [G], [T], LLeaf [C]) in
  simplest_evtree [t1; t3] = (t1, 2)
;; run_test "simplest_evtree: tie goes to the first" test
;; run_failing_test "simplest_evtree: empty list fails"
     (fun () -> let _ = simplest_evtree [] in true)
