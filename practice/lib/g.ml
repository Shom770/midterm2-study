(* Stand-in for the course's Graphics shim. Instead of drawing, it records
   every operation in OCaml Graphics coordinates (origin at the bottom left),
   so tests can inspect what was drawn and the web page can paint it on a
   canvas. Only the functions gctx.ml uses are provided. *)

type op =
  | Line of int * int * int * int * int * int        (* color, width, x1, y1, x2, y2 *)
  | Rect of int * int * int * int * int * int        (* color, width, x, y, w, h *)
  | FillRect of int * int * int * int * int          (* color, x, y, w, h *)
  | Ellipse of int * int * int * int * int * int     (* color, width, cx, cy, rx, ry *)
  | Text of int * int * int * string                 (* color, x, y, text *)
  | Plot of int * int * int                          (* color, x, y *)

let js_mode = true
let ops : op list ref = ref []          (* most recent first *)
let emit (o : op) : unit = ops := o :: !ops

let width = ref 640
let height = ref 480
let cur_x = ref 0
let cur_y = ref 0
let color = ref 0
let line_width = ref 1

(* Text metrics are fixed so layouts are the same everywhere: 8 px per
   character, 16 px tall. The page draws text with a matching font. *)
let char_w = 8
let char_h = 16

let set_font (_ : string) : unit = ()
let set_text_size (_ : int) : unit = ()
let clear_graph () : unit = ops := []
let open_graphics' () : unit = ()
let rgb (r : int) (g : int) (b : int) : int = (r lsl 16) lor (g lsl 8) lor b
let set_color (c : int) : unit = color := c
let set_line_width (w : int) : unit = line_width := max 1 w
let size_x () : int = !width
let size_y () : int = !height
let moveto (x : int) (y : int) : unit = cur_x := x; cur_y := y
let lineto (x : int) (y : int) : unit =
  emit (Line (!color, !line_width, !cur_x, !cur_y, x, y));
  cur_x := x; cur_y := y
let text_size (s : string) : int * int = (char_w * String.length s, char_h)
let draw_string (s : string) : unit =
  emit (Text (!color, !cur_x, !cur_y, s));
  cur_x := !cur_x + char_w * String.length s
let draw_rect (x : int) (y : int) (w : int) (h : int) : unit =
  emit (Rect (!color, !line_width, x, y, w, h))
let fill_rect (x : int) (y : int) (w : int) (h : int) : unit =
  emit (FillRect (!color, x, y, w, h))
let plot (x : int) (y : int) : unit = emit (Plot (!color, x, y))
let draw_ellipse (x : int) (y : int) (rx : int) (ry : int) : unit =
  emit (Ellipse (!color, !line_width, x, y, rx, ry))
