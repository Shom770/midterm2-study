# Question 25: acids_of_helix

File: `dna.ml`

```
Homework 2, Problem 3: acids_of_helix
Below is an excerpt of dna.ml from Homework 2. The type acid and the
function acid_of_triplet are provided, exactly as in the homework. Also
provided, already solved, is a helper decode_until_end that takes a helix
starting at a start codon and decodes it triplet by triplet, stopping when
the triplets run out or an END triplet is reached (the END itself is not
included). The body of acids_of_helix has been replaced by failwith.
Fill it in.
acids_of_helix h returns the first acid chain in h: skip everything up to
the first occurrence of [T; A; C] (the start codon, which encodes Met),
then decode from that point on. If there is no [T; A; C], the result is
[]. Note that decode_until_end should be given the helix beginning with
the start codon itself, not the part after it -- that is how Met ends up as
the first acid of the chain.

acids_of_helix [T; A; C; A; C; T] = [Met]
acids_of_helix [A; G; T; A; C; T; A; C; T; C; C] = [Met; Met; Arg]
acids_of_helix [A; G; T; A; G; C; C; A; T; C; G; G] = []
```
