(* The SET interface, cut down to the operations this question uses. *)
module type SET = sig
  type 'a set
  val empty : 'a set
  val list_of_set : 'a set -> 'a list
  val add : 'a -> 'a set -> 'a set
  val set_of_list : 'a list -> 'a set
end
