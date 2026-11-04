(* Stand-in for helices.ml from Homework 2. The real file holds long DNA
   sequences; these short placeholders are enough for the tests here. *)
type nucleotide =
  | G (* guanine *)
  | C (* cytosine *)
  | A (* adenine *)
  | T (* thymine *)

type helix = nucleotide list

let white_cheeked_gibbon : helix = [A; G; T; C; A; T]
let siamang : helix = [A; G; T; C; C; T]
let lar_gibbon : helix = [A; G; A; C; A; T]
let pileated_gibbon : helix = [T; G; T; C; A; T]
