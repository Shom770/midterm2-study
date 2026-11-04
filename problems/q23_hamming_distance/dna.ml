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

(* Given two equal length helices, your next task is to compute the number of
   differences between them, i.e., the number of nucleotides that would need
   to be changed to transform one helix into the other.

   NOTE: You should ASSUME that this function will always be applied to two
   lists with the *same* number of elements. Do NOT compute the lengths of the
   lists when implementing this function. If you do so, your code may be
   ungradeable because it is TOO SLOW (e.g., it would require a length
   calculation to occur at every recursive invocation). It does not matter
   what your function returns when applied to different length lists. We
   won't test that case. *)

let rec hamming_distance (x1: helix) (x2: helix) : int =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "hamming_distance: Fill in here!"

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  hamming_distance [G; A; A; A] [C; A; T; T] = 3
;; run_test "hamming_distance multiple differences" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = hamming_distance [G; A; G] [A; G; G] = 2
;; run_test "hamming_distance: example from the problem" test
let test () : bool = hamming_distance [] [] = 0
;; run_test "hamming_distance: empty helices" test
