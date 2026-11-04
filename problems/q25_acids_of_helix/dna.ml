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

type acid =
  | Ala | Arg | Asn | Asp | Cys | Glu | Gln | Gly | His | Ile | Leu | Lys | Met
  | Phe | Pro | Ser | Thr | Trp | Tyr | Val | END

(* Given a nucleotide triplet, the function acid_of_triplet outputs a decoded
   acid or END. *)

let acid_of_triplet (n1: nucleotide) (n2: nucleotide) (n3: nucleotide)
  : acid =
  begin match (n1, n2, n3) with
    | (A, A, A) -> Phe | (A, A, G) -> Phe | (A, A, T) -> Leu | (A, A, C) -> Leu
    | (G, A, A) -> Leu | (G, A, G) -> Leu | (G, A, T) -> Leu | (G, A, C) -> Leu
    | (T, A, A) -> Ile | (T, A, G) -> Ile | (T, A, T) -> Ile | (T, A, C) -> Met
    | (C, A, A) -> Val | (C, A, G) -> Val | (C, A, T) -> Val | (C, A, C) -> Val
    | (A, G, A) -> Ser | (A, G, G) -> Ser | (A, G, T) -> Ser | (A, G, C) -> Ser
    | (G, G, A) -> Pro | (G, G, G) -> Pro | (G, G, T) -> Pro | (G, G, C) -> Pro
    | (T, G, A) -> Thr | (T, G, G) -> Thr | (T, G, T) -> Thr | (T, G, C) -> Thr
    | (C, G, A) -> Ala | (C, G, G) -> Ala | (C, G, T) -> Ala | (C, G, C) -> Ala
    | (A, T, A) -> Tyr | (A, T, G) -> Tyr | (A, T, T) -> END | (A, T, C) -> END
    | (G, T, A) -> His | (G, T, G) -> His | (G, T, T) -> Gln | (G, T, C) -> Gln
    | (T, T, A) -> Asn | (T, T, G) -> Asn | (T, T, T) -> Lys | (T, T, C) -> Lys
    | (C, T, A) -> Asp | (C, T, G) -> Asp | (C, T, T) -> Glu | (C, T, C) -> Glu
    | (A, C, A) -> Cys | (A, C, G) -> Cys | (A, C, T) -> END | (A, C, C) -> Trp
    | (G, C, A) -> Arg | (G, C, G) -> Arg | (G, C, T) -> Arg | (G, C, C) -> Arg
    | (T, C, A) -> Ser | (T, C, G) -> Ser | (T, C, T) -> Arg | (T, C, C) -> Arg
    | (C, C, A) -> Gly | (C, C, G) -> Gly | (C, C, T) -> Gly | (C, C, C) -> Gly
  end

(* Your next task: given a helix, decode its first acid chain. This is
   done as follows...

   1. Start decoding by scanning the helix for the first occurrence of
      the sequence [T; A; C] (which encodes the acid Met). This starts
      an acid chain with Met as its head element.

   2. After the first occurrence of [T; A; C], decode the following
      nucleotides in the helix in triplets and build a list of the
      results.

   3. Stop decoding when either (a) we run out of triplets or (b) we
      encounter one of the triplets encoding the END acid ([A; T; T],
      [A; C; T], or [A; T; C]). If we encounter the END acid, the END
      marker should NOT be included in the output acid list.

   You should disregard any nucleotides that might happen to occur
   before the first occurrence of Met (including END markers).

   We have split this into two functions. The first, decode_until_end,
   is provided: given a helix that starts at the beginning of an acid
   chain, it decodes triplets until it runs out of triplets or reaches
   an END triplet (steps 2 and 3 above). Your job is step 1: write
   acids_of_helix, which finds the first [T; A; C] and hands the rest
   of the work to decode_until_end. *)

let rec decode_until_end (y: helix) : acid list =
  begin match y with
    | n1 :: n2 :: n3 :: tl ->
      let acid = acid_of_triplet n1 n2 n3 in
      if acid = END then []
      else acid :: decode_until_end tl
    | _ -> []
  end

let rec acids_of_helix (x: helix) : acid list =
  (* REPLACE THE NEXT LINE WITH YOUR SOLUTION *)
  failwith "acids_of_helix: Fill in here!"

(* We've given you one test case below. Others will be supplied by the
   autograder. Feel free to add your own if you find it helpful. *)

let test () : bool =
  acids_of_helix [A; G; T; A; C; T; A; C; T; C; C] = [Met; Met; Arg]
;; run_test "acids_of_helix multiple Mets at start" test

(* ---- Extra tests from the problem statement ---- *)

let test () : bool = acids_of_helix [T; A; C; A; C; T] = [Met]
;; run_test "acids_of_helix: Met then END" test
let test () : bool = acids_of_helix [A; G; T; A; G; C; C; A; T; C; G; G] = []
;; run_test "acids_of_helix: no start codon" test
let test () : bool = acids_of_helix [] = []
;; run_test "acids_of_helix: empty helix" test
