(* The QUEUE interface, cut down to the operations this question uses. *)
module type QUEUE = sig
  type 'a queue
  val create : unit -> 'a queue
  val enq : 'a -> 'a queue -> unit
  val from_list : 'a list -> 'a queue
  val valid : 'a queue -> bool
  val is_empty : 'a queue -> bool
  val deq : 'a queue -> 'a option
  val to_list : 'a queue -> 'a list
end
