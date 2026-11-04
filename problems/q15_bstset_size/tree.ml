(* Stand-in for tree.ml from Homework 3 (already solved), used by treeSet.ml. *)
type 'a tree =
  | Empty
  | Node of 'a tree * 'a * 'a tree

let rec inorder (t : 'a tree) : 'a list =
  begin match t with
  | Empty -> []
  | Node (lt, v, rt) -> inorder lt @ [v] @ inorder rt
  end

let rec insert (x : 'a) (t : 'a tree) : 'a tree =
  begin match t with
  | Empty -> Node (Empty, x, Empty)
  | Node (lt, v, rt) ->
    if x < v then Node (insert x lt, v, rt)
    else if x > v then Node (lt, v, insert x rt)
    else t
  end

let tree_of_list (l : 'a list) : 'a tree =
  List.fold_left (fun t x -> insert x t) Empty l
