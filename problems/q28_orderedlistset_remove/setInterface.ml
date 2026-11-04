(* The SET interface, cut down to the operations this question uses. *)
module type SET = sig
  type 'a set
  val empty : 'a set
  val list_of_set : 'a set -> 'a list
  val remove : 'a -> 'a set -> 'a set
  val member : 'a -> 'a set -> bool
end
