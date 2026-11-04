(* Drives a widget without a real window, for tests and for the live preview.

   Coordinates in this module are widget-local, (0,0) at the top left, the
   same convention as the GUI library. The window is sized to the widget. *)

let () = Gctx.open_graphics ()

(* Size the pretend window to the widget so coordinate flips line up. *)
let fit (w : Widget.widget) : unit =
  let (wd, ht) = w.Widget.size () in
  G.width := max 1 wd;
  G.height := max 1 ht

(** Repaint [w] and return what it drew, in drawing order. *)
let render (w : Widget.widget) : G.op list =
  fit w;
  G.ops := [];
  w.Widget.repaint Gctx.top_level;
  List.rev !G.ops

(** Send one event to [w] at widget-local position (x, y). *)
let send (w : Widget.widget) (et : Gctx.event_type) ((x, y) : int * int) : unit =
  fit w;
  w.Widget.handle Gctx.top_level (et, (x, G.size_y () - 1 - y))

(** A full click: MouseDown then MouseUp at the same spot. *)
let click (w : Widget.widget) (p : int * int) : unit =
  send w Gctx.MouseDown p;
  send w Gctx.MouseUp p

(* ---- Helpers for inspecting a render, in widget-local coordinates ---- *)

let flip (y : int) : int = G.size_y () - 1 - y

(** Every string drawn, in order. *)
let strings (ops : G.op list) : string list =
  List.filter_map (fun o -> match o with G.Text (_, _, _, s) -> Some s | _ -> None) ops

(** Centers and radii of every ellipse drawn: ((cx, cy), rx, ry). *)
let ellipses (ops : G.op list) : ((int * int) * int * int) list =
  List.filter_map
    (fun o -> match o with
       | G.Ellipse (_, _, x, y, rx, ry) -> Some ((x, flip y), rx, ry)
       | _ -> None)
    ops

(** Filled rectangles as (color, (x, y) of the top-left corner, (w, h)). *)
let filled (ops : G.op list) : (Gctx.color * (int * int) * (int * int)) list =
  List.filter_map
    (fun o -> match o with
       | G.FillRect (c, x, y, w, h) ->
         Some ({ Gctx.r = (c lsr 16) land 255; g = (c lsr 8) land 255; b = c land 255 },
               (x, flip y - h), (w, h))
       | _ -> None)
    ops

(** Line segments as ((x1, y1), (x2, y2)). *)
let lines (ops : G.op list) : ((int * int) * (int * int)) list =
  List.filter_map
    (fun o -> match o with
       | G.Line (_, _, x1, y1, x2, y2) -> Some ((x1, flip y1), (x2, flip y2))
       | _ -> None)
    ops

(* ---- Live preview protocol (used by the web page) ---- *)

let current : Widget.widget option ref = ref None

let print_op (o : G.op) : unit =
  match o with
  | G.Line (c, lw, x1, y1, x2, y2) -> Printf.printf "L %d %d %d %d %d %d\n" c lw x1 y1 x2 y2
  | G.Rect (c, lw, x, y, w, h) -> Printf.printf "R %d %d %d %d %d %d\n" c lw x y w h
  | G.FillRect (c, x, y, w, h) -> Printf.printf "F %d %d %d %d %d\n" c x y w h
  | G.Ellipse (c, lw, x, y, rx, ry) -> Printf.printf "E %d %d %d %d %d %d\n" c lw x y rx ry
  | G.Text (c, x, y, s) -> Printf.printf "T %d %d %d %S\n" c x y s
  | G.Plot (c, x, y) -> Printf.printf "P %d %d %d\n" c x y

let paint () : unit =
  match !current with
  | None -> ()
  | Some w ->
    let ops = render w in
    Printf.printf "@@GUI %d %d\n" !G.width !G.height;
    List.iter print_op ops;
    Printf.printf "@@END\n%!"

(** Show [w] in the preview pane. *)
let show (w : Widget.widget) : unit =
  current := Some w;
  paint ()

(** Called by the page for each mouse or key event on the preview. *)
let event (kind : string) (x : int) (y : int) : unit =
  match !current with
  | None -> ()
  | Some w ->
    let et =
      match kind with
      | "down" -> Gctx.MouseDown
      | "up" -> Gctx.MouseUp
      | "drag" -> Gctx.MouseDrag
      | "move" -> Gctx.MouseMove
      | k -> Gctx.KeyPress (if String.length k > 0 then k.[0] else ' ')
    in
    (try send w et (x, y) with e -> Printf.printf "@@ERR %s\n" (Printexc.to_string e));
    paint ()
