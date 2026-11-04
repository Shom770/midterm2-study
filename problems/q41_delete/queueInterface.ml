(* The QUEUE interface, cut down to the operations this question uses. *)
module type QUEUE = sig
  type 'a queue
  val delete : 'a -> 'a queue -> unit
  val create : unit -> 'a queue
  val enq : 'a -> 'a queue -> unit
  val deq : 'a queue -> 'a option
  val to_list : 'a queue -> 'a list
end
