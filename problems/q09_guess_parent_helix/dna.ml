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

(* Assuming x1 and x2 are valid helices, guess the valid helix that
   labels their parent node in an evolutionary tree. The guessed helix
   is computed using nucleotide-by-nucleotide comparison of x1 and x2:
   if the nucleotides match, the corresponding parent nucleotide is
   the same. If they don't match, the corresponding parent nucleotide
   is (arbitrarily) A. *)

let rec guess_parent_helix (x1: helix) (x2: helix) : helix =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "guess_parent_helix: Fill in here!"

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  guess_parent_helix [A; C; G; G; T; A; C] [C; T; G; C; T; A; A]
  = [A; A; G; A; T; A; A]
;; run_test "guess_parent_helix multiple differences" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = guess_parent_helix [T; C; A] [G; C; A] = [A; C; A]
;; run_test "guess_parent_helix: example from the problem" test
let test () : bool = guess_parent_helix [] [] = []
;; run_test "guess_parent_helix: empty helices" test
let test () : bool = guess_parent_helix [G; T] [G; T] = [G; T]
;; run_test "guess_parent_helix: identical helices" test
