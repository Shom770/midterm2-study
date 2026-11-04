(* Stand-in for higherOrder.ml from Homework 3: the functions other files use. *)
let rec fold (combine : 'a -> 'b -> 'b) (base : 'b) (l : 'a list) : 'b =
  begin match l with
  | [] -> base
  | x :: xs -> combine x (fold combine base xs)
  end

let rec transform (f : 'a -> 'b) (l : 'a list) : 'b list =
  begin match l with
  | [] -> []
  | x :: xs -> f x :: transform f xs
  end

let rec filter (pred : 'a -> bool) (l : 'a list) : 'a list =
  begin match l with
  | [] -> []
  | x :: xs -> if pred x then x :: filter pred xs else filter pred xs
  end
