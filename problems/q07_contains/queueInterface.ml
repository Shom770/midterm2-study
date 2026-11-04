(* The QUEUE interface, cut down to the operations this question uses. *)
module type QUEUE = sig
  type 'a queue
  val contains : 'a -> 'a queue -> bool
  val create : unit -> 'a queue
  val enq : 'a -> 'a queue -> unit
  val to_list : 'a queue -> 'a list
end
