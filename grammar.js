var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// tree-sitter-html/grammar.js
var require_grammar = __commonJS({
  "tree-sitter-html/grammar.js"(exports, module) {
    module.exports = grammar({
      name: "html",
      extras: ($) => [
        $.comment,
        /\s+/
      ],
      externals: ($) => [
        $._start_tag_name,
        $._script_start_tag_name,
        $._style_start_tag_name,
        $._end_tag_name,
        $.erroneous_end_tag_name,
        "/>",
        $._implicit_end_tag,
        $.raw_text,
        $.comment
      ],
      rules: {
        document: ($) => repeat($._node),
        doctype: ($) => seq(
          "<!",
          alias($._doctype, "doctype"),
          /[^>]+/,
          ">"
        ),
        _doctype: (_) => /[Dd][Oo][Cc][Tt][Yy][Pp][Ee]/,
        _node: ($) => choice(
          $.doctype,
          $.entity,
          $.text,
          $.element,
          $.script_element,
          $.style_element,
          $.erroneous_end_tag
        ),
        element: ($) => choice(
          seq(
            $.start_tag,
            repeat($._node),
            choice($.end_tag, $._implicit_end_tag)
          ),
          $.self_closing_tag
        ),
        script_element: ($) => seq(
          alias($.script_start_tag, $.start_tag),
          optional($.raw_text),
          $.end_tag
        ),
        style_element: ($) => seq(
          alias($.style_start_tag, $.start_tag),
          optional($.raw_text),
          $.end_tag
        ),
        start_tag: ($) => seq(
          "<",
          alias($._start_tag_name, $.tag_name),
          field("attribute", repeat($.attribute)),
          ">"
        ),
        script_start_tag: ($) => seq(
          "<",
          alias($._script_start_tag_name, $.tag_name),
          field("attribute", repeat($.attribute)),
          ">"
        ),
        style_start_tag: ($) => seq(
          "<",
          alias($._style_start_tag_name, $.tag_name),
          field("attribute", repeat($.attribute)),
          ">"
        ),
        self_closing_tag: ($) => seq(
          "<",
          alias($._start_tag_name, $.tag_name),
          field("attribute", repeat($.attribute)),
          "/>"
        ),
        end_tag: ($) => seq(
          "</",
          alias($._end_tag_name, $.tag_name),
          ">"
        ),
        erroneous_end_tag: ($) => seq(
          "</",
          $.erroneous_end_tag_name,
          ">"
        ),
        attribute: ($) => seq(
          $.attribute_name,
          optional(seq(
            "=",
            choice(
              $.attribute_value,
              $.quoted_attribute_value
            )
          ))
        ),
        attribute_name: (_) => /[^<>"'/=\s]+/,
        attribute_value: (_) => /[^<>"'=\s]+/,
        // An entity can be named, numeric (decimal), or numeric (hexacecimal). The
        // longest entity name is 29 characters long, and the HTML spec says that
        // no more will ever be added.
        entity: (_) => /&(#([xX][0-9a-fA-F]{1,6}|[0-9]{1,5})|[A-Za-z]{1,30});?/,
        quoted_attribute_value: ($) => choice(
          seq("'", optional(alias(/[^']+/, $.attribute_value)), "'"),
          seq('"', optional(alias(/[^"]+/, $.attribute_value)), '"')
        ),
        text: (_) => /[^<>&\s]([^<>&]*[^<>&\s])?/
      }
    });
  }
});

// main/NodeMap.ts
var NodeMap = class {
  cachedNodes;
  extraNodes;
  constructor() {
    this.cachedNodes = /* @__PURE__ */ new Map();
    this.extraNodes = /* @__PURE__ */ new Set();
  }
  /**
   * The method used to collect, cache and return the entire grammar
   * new nodes needing cached can be added at a later point
   */
  add(...nodes2) {
    if (this.size() != 0) {
      nodes2.forEach((node) => {
        if (!this.has(node)) {
          this.set(node);
        }
      });
      return this.cachedNodes.values();
    }
    nodes2.forEach((node) => this.set(node));
    return this.cachedNodes.values();
  }
  /**
   * Map the node to the cache
   */
  set(node) {
    this.cachedNodes.set(node.name, node);
  }
  /**
   * returns all the cached nodes, including the extra nodes specified
   */
  all() {
    return this.extraNodes.size == 0 ? this.cachedNodes.values() : this.mergedWith(...this.cachedNodes.values());
  }
  /**
   * rule specific nodes to be used temporarily.
   */
  with(...nodes2) {
    nodes2.forEach((node) => this.extraNodes.add(node));
    return this;
  }
  /**
   * Checks if a node already exists
   */
  has(node) {
    return this.cachedNodes.has(node.name);
  }
  /**
   * Return cached nodes without the specified nodes.
   *
   * If extra nodes are provided, it will be merged and returned as well
   */
  without(...nodes2) {
    const temp = new Map(this.cachedNodes);
    nodes2.forEach((node) => temp.delete(node.name));
    return this.extraNodes.size == 0 ? temp.values() : this.mergedWith(...temp.values());
  }
  /**
   * returns the size of the Data Structure
   */
  size() {
    return this.cachedNodes.size;
  }
  /**
   * Return the merged node set and clears the extraNodes.
   */
  mergedWith(...nodes2) {
    const temp = new Set(this.extraNodes);
    this.extraNodes.clear();
    return temp.union(new Set(nodes2));
  }
};

// main/grammar.ts
var import_grammar = __toESM(require_grammar());
var nodes = new NodeMap();
function pipeSep1(rule) {
  return seq(rule, repeat(seq("|", rule)));
}
function ampSep1(rule) {
  return seq(rule, repeat(seq(token("&"), rule)));
}
function keyword(word, aliasAsWord = true) {
  let result = new RegExp(word, "i");
  if (aliasAsWord)
    result = alias(result, word);
  return result;
}
var PREC = {
  COMMA: -1,
  CAST: -1,
  LOGICAL_OR_2: 1,
  LOGICAL_XOR: 2,
  LOGICAL_AND_2: 3,
  ASSIGNMENT: 4,
  TERNARY: 5,
  NULL_COALESCE: 6,
  LOGICAL_OR_1: 7,
  LOGICAL_AND_1: 8,
  BITWISE_OR: 9,
  BITWISE_XOR: 10,
  BITWISE_AND: 11,
  EQUALITY: 12,
  INEQUALITY: 13,
  PIPE: 14,
  CONCAT: 15,
  SHIFT: 16,
  PLUS: 17,
  TIMES: 18,
  EXPONENTIAL: 19,
  NEG: 20,
  INSTANCEOF: 21,
  INC: 22,
  SCOPE: 23,
  NEW: 24,
  CALL: 25,
  MEMBER: 26,
  DEREF: 27,
  IDENTIFIER: 1,
  KEYWORD: 2,
  ECHO: 3,
  COMMENT: 4
};
function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
function commaSep(rule) {
  return optional(commaSep1(rule));
}
var grammar_default = grammar(import_grammar.default, {
  name: "blade",
  conflicts: ($) => [
    [$._array_destructing, $.array_creation_expression],
    [$.primary_expression, $._array_destructing_element],
    [$.type, $.union_type, $.intersection_type, $.disjunctive_normal_form_type],
    [$.union_type, $.disjunctive_normal_form_type],
    [$.intersection_type],
    [$.namespace_name]
  ],
  supertypes: ($) => [
    $.expression,
    $.primary_expression,
    $.type,
    $.literal
  ],
  rules: {
    // The entire grammar
    _node: ($) => choice(
      ...nodes.add(
        // tree-sitter-html
        $.doctype,
        $.entity,
        $.text,
        $.element,
        $.script_element,
        $.style_element,
        $.erroneous_end_tag,
        // tree-sitter-blade
        $.keyword,
        $.php_statement,
        $._inline_directive,
        $.comment,
        $.switch,
        $.for_directive,
        $.foreach_directive,
        $.forelse_directive,
        $.while_directive,
        $.envoy,
        $.livewire,
        // nested
        $.fragment,
        $.section,
        $.once,
        $.verbatim,
        $.stack,
        // conditional
        $.conditional
      )
    ),
    // ------------------
    // https://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: (_) => token(prec(PREC.COMMENT, seq("{{--", /[^-]*-+([^}-][^-]*-+)*/, "}}"))),
    // !keywords
    keyword: ($) => alias(
      choice(
        "@csrf",
        "@viteReactRefresh",
        "@livewireStyles",
        "@livewireScripts",
        "@livewireScriptConfig",
        "@parent",
        "@inertia",
        "@inertiaHead",
        // log1x/sage-directives #77
        "@routes",
        "@permalink",
        "@title",
        "@content",
        "@excerpt",
        // WireUI
        "@wireUiScripts"
      ),
      $.directive
    ),
    // ! PHP Statements
    php_statement: ($) => choice($._escaped, $._unescaped, $._setup, $._raw, $._php),
    // From tree-sitter-php
    _php: ($) => seq(
      $.php_tag,
      optional(alias($.text, $.php_only)),
      $.php_end_tag
    ),
    php_tag: (_) => /<\?([pP][hH][pP]|=)?/,
    php_end_tag: (_) => "?>",
    // --------------------
    _escaped: ($) => seq(
      token(prec(PREC.ECHO, "{{")),
      optional(
        $.expression
      ),
      token(prec(PREC.ECHO, "}}"))
    ),
    _unescaped: ($) => seq(
      token(prec(PREC.ECHO, "{!!")),
      optional(
        $.expression
      ),
      token(prec(PREC.ECHO, "!!}"))
    ),
    // ! raw php
    _raw: ($) => choice($._inline_raw, $._multi_line_raw),
    _inline_raw: ($) => seq(alias("@php", $.directive), $._directive_parameter),
    _multi_line_raw: ($) => seq(
      alias("@php", $.directive_start),
      optional(alias($.text, $.php_only)),
      alias("@endphp", $.directive_end)
    ),
    // tree-sitter-html override
    attribute: ($) => choice(
      $._blade_attribute,
      $._html_attribute,
      $._expression_attribute,
      $._short_attribute,
      $.php_statement
    ),
    attribute_name: (_) => token(prec(-1, /[^<>"'/=\s]+/)),
    attribute_value: (_) => token(prec(-1, /[^<>"'/=\s]+/)),
    quoted_attribute_value: ($) => choice(
      seq(
        "'",
        optional(
          repeat(
            choice(
              $.php_statement,
              $.conditional,
              $._inline_directive,
              $.comment,
              alias($._singly_quoted_attribute_text, $.attribute_value)
            )
          )
        ),
        "'"
      ),
      seq(
        '"',
        optional(
          repeat(
            choice(
              $.php_statement,
              $.conditional,
              $._inline_directive,
              $.comment,
              alias($._doubly_quoted_attribute_text, $.attribute_value)
            )
          )
        ),
        '"'
      )
    ),
    _quoted_expression: ($) => choice(
      seq(
        "'",
        optional(
          $.expression
        ),
        "'"
      ),
      seq(
        '"',
        optional(
          $.expression
        ),
        '"'
      )
    ),
    // utilised from tree-sitter-html
    _html_attribute: ($) => seq(
      $.attribute_name,
      optional(
        seq(
          "=",
          choice($.attribute_value, $.quoted_attribute_value)
        )
      )
    ),
    _expression_attribute: ($) => seq(
      ":",
      $.attribute_name,
      seq(
        "=",
        alias($._quoted_expression, $.quoted_attribute_value)
      )
    ),
    _short_attribute: ($) => seq(":", $.variable_name),
    // ! Conditional Blade Attribute Directives
    _blade_attribute: ($) => seq(
      alias(
        choice(
          "@class",
          "@style",
          "@checked",
          "@selected",
          "@disabled",
          "@readonly",
          "@required"
        ),
        $.directive
      ),
      $._directive_parameter
    ),
    // !inline directives
    _inline_directive: ($) => choice(
      $.props,
      seq(
        alias(
          choice(
            "@include",
            "@includeIf",
            "@includeWhen",
            "@includeUnless",
            "@includeFirst",
            "@extends",
            "@yield",
            "@method",
            "@inject",
            "@each",
            "@vite",
            "@livewire",
            "@aware",
            "@servers",
            "@import",
            "@js",
            "@svg",
            "@use",
            "@stack",
            // log1x/sage-directives #77
            "@asset",
            "@json",
            "@script",
            "@thumbnail",
            "@extract",
            "@set",
            // ACF (Advanced Custom Fields)
            "@field",
            "@options",
            // WireUI
            "@wireUiScripts"
          ),
          $.directive
        ),
        $._directive_parameter
      )
    ),
    props: ($) => seq(
      "@props",
      "(",
      choice($._string, $.array_creation_expression),
      ")"
    ),
    // !nested directives
    fragment: ($) => seq(
      alias("@fragment", $.directive_start),
      $._directive_parameter,
      optional(
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.livewire,
              $.fragment,
              $.section,
              $.stack,
              $.once
            )
          )
        )
      ),
      alias("@endfragment", $.directive_end)
    ),
    // ! section
    section: ($) => prec.left(
      seq(
        alias("@section", $.directive_start),
        $._directive_parameter,
        optional(
          seq(
            repeat1(
              choice(
                ...nodes.without(
                  $.doctype,
                  $.section,
                  $.once,
                  $.envoy,
                  $.fragment
                )
              )
            ),
            alias(/@(endsection|show)/, $.directive_end)
          )
        )
      )
    ),
    once: ($) => seq(
      alias("@once", $.directive_start),
      optional(
        repeat1(
          choice(...nodes.without($.doctype, $.envoy, $.section))
        )
      ),
      alias("@endonce", $.directive_end)
    ),
    verbatim: ($) => seq(
      alias("@verbatim", $.directive_start),
      optional(
        repeat1(
          choice(...nodes.without($.doctype, $.livewire, $.envoy))
        )
      ),
      alias("@endverbatim", $.directive_end)
    ),
    stack: ($) => choice(
      $._push,
      $._pushOnce,
      $._pushIf,
      $._prepend,
      $._prependOnce
    ),
    _push: ($) => seq(
      alias("@push", $.directive_start),
      $._directive_parameter,
      optional(
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.livewire,
              $.loop,
              $._loop_operator,
              $.conditional,
              $.stack,
              $.once,
              $.fragment,
              $.section,
              $.verbatim
            )
          )
        )
      ),
      alias("@endpush", $.directive_end)
    ),
    _pushOnce: ($) => seq(
      alias("@pushOnce", $.directive_start),
      $._directive_parameter,
      optional(
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.livewire,
              $.loop,
              $._loop_operator,
              $.conditional,
              $.stack,
              $.once,
              $.fragment,
              $.section,
              $.verbatim
            )
          )
        )
      ),
      alias("@endPushOnce", $.directive_end)
    ),
    _pushIf: ($) => seq(
      alias("@pushIf", $.directive_start),
      $._directive_parameter,
      optional(
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.livewire,
              $.loop,
              $._loop_operator,
              $.conditional,
              $.stack,
              $.once,
              $.fragment,
              $.section,
              $.verbatim
            )
          )
        )
      ),
      alias("@endPushIf", $.directive_end)
    ),
    _prepend: ($) => seq(
      alias("@prepend", $.directive_start),
      $._directive_parameter,
      optional(
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.livewire,
              $.loop,
              $._loop_operator,
              $.conditional,
              $.stack,
              $.once,
              $.fragment,
              $.section,
              $.verbatim
            )
          )
        )
      ),
      alias("@endprepend", $.directive_end)
    ),
    _prependOnce: ($) => seq(
      alias("@prependOnce", $.directive_start),
      $._directive_parameter,
      optional(
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.livewire,
              $.loop,
              $._loop_operator,
              $.conditional,
              $.stack,
              $.once,
              $.fragment,
              $.section,
              $.verbatim
            )
          )
        )
      ),
      alias("@endPrependOnce", $.directive_end)
    ),
    // !Conditionals
    conditional: ($) => choice(
      $._if,
      $._unless,
      $._isset,
      $._empty,
      $._auth,
      $._guest,
      $._production,
      $._env,
      $._hasSection,
      $._sectionMissing,
      $._error,
      $._authorization,
      $._feature,
      $._custom
    ),
    // used in the conditional body rules
    conditional_keyword: ($) => choice(
      alias("@else", $.directive),
      seq(
        alias(/@(elseif|else[a-zA-Z]+)/, $.directive),
        $._directive_parameter
      )
    ),
    _if: ($) => seq(
      alias("@if", $.directive_start),
      $._conditional_directive_body,
      alias("@endif", $.directive_end)
    ),
    _unless: ($) => seq(
      alias("@unless", $.directive_start),
      $._conditional_directive_body,
      alias("@endunless", $.directive_end)
    ),
    _isset: ($) => seq(
      alias("@isset", $.directive_start),
      $._conditional_directive_body,
      alias("@endisset", $.directive_end)
    ),
    _empty: ($) => seq(
      alias("@empty", $.directive_start),
      $._conditional_directive_body,
      alias("@endempty", $.directive_end)
    ),
    _auth: ($) => seq(
      alias("@auth", $.directive_start),
      $._conditional_body_with_optional_parameter,
      alias("@endauth", $.directive_end)
    ),
    _guest: ($) => seq(
      alias("@guest", $.directive_start),
      $._conditional_body_with_optional_parameter,
      alias("@endguest", $.directive_end)
    ),
    _production: ($) => seq(
      alias("@production", $.directive_start),
      optional($._conditonal_body),
      alias("@endproduction", $.directive_end)
    ),
    _env: ($) => seq(
      alias("@env", $.directive_start),
      $._conditional_directive_body,
      alias("@endenv", $.directive_end)
    ),
    _hasSection: ($) => seq(
      alias("@hasSection", $.directive_start),
      $._conditional_directive_body,
      alias("@endif", $.directive_end)
    ),
    _sectionMissing: ($) => seq(
      alias("@sectionMissing", $.directive_start),
      $._conditional_directive_body,
      alias("@endif", $.directive_end)
    ),
    _error: ($) => seq(
      alias("@error", $.directive_start),
      $._conditional_directive_body,
      alias("@enderror", $.directive_end)
    ),
    // !Authorisation Directives
    _authorization: ($) => choice($._can, $._canany, $._cannot),
    _can: ($) => seq(
      alias("@can", $.directive_start),
      $._conditional_directive_body,
      alias("@endcan", $.directive_end)
    ),
    _cannot: ($) => seq(
      alias("@cannot", $.directive_start),
      $._conditional_directive_body,
      alias("@endcannot", $.directive_end)
    ),
    _canany: ($) => seq(
      alias("@canany", $.directive_start),
      $._conditional_directive_body,
      alias("@endcanany", $.directive_end)
    ),
    // !Laravel Pennant
    _feature: ($) => seq(
      alias("@feature", $.directive_start),
      seq(
        $._directive_parameter,
        optional($._feature_body)
      ),
      alias("@endfeature", $.directive_end)
    ),
    _else_feature: ($) => seq(
      alias("@elsefeature", $.directive),
      choice(
        $._directive_parameter
      )
    ),
    _feature_body: ($) => repeat1(
      choice(
        ...nodes.with(
          $.conditional_keyword,
          $._else_feature
        ).all()
      )
    ),
    // !Custom if Statements
    _custom: ($) => seq(
      choice(
        alias(/@unless[a-zA-Z\d]+/, $.directive_start),
        alias(token(prec(-1, /@[a-zA-Z\d]+/)), $.directive_start)
      ),
      $._conditional_directive_body,
      alias(token(prec(1, /@end[a-zA-Z\d]+/)), $.directive_end)
    ),
    // !switch
    switch: ($) => seq(
      alias("@switch", $.directive_start),
      $._directive_parameter,
      repeat($._case),
      optional(
        seq(
          alias("@default", $.directive),
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.section,
                $.once,
                $.stack,
                $.verbatim,
                $.envoy,
                $.fragment,
                $.switch
              )
            )
          )
        )
      ),
      alias("@endswitch", $.directive_end)
    ),
    _case: ($) => seq(
      alias("@case", $.directive),
      $._directive_parameter,
      optional(
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.section,
              $.once,
              $.stack,
              $.verbatim,
              $.envoy,
              $.fragment,
              $.switch
            )
          )
        )
      ),
      optional(alias("@break", $.directive))
    ),
    // !Loops
    _forelse_loop_operator: ($) => choice(
      $._loop_operator,
      alias("@empty", $.directive)
    ),
    _loop_operator: ($) => seq(
      alias(/@(continue|break)/, $.directive),
      optional($._directive_parameter)
    ),
    for_directive: ($) => seq(
      field("directive_start", "@for"),
      "(",
      field("initialize", optional($._expressions)),
      ";",
      field("condition", optional($._expressions)),
      ";",
      field("update", optional($._expressions)),
      ")",
      field("body", optional($._loop_body)),
      field("directive_end", "@endfor")
    ),
    foreach_directive: ($) => seq(
      field("directive_start", "@foreach"),
      "(",
      $.expression,
      keyword("as"),
      choice(
        alias($.foreach_pair, $.pair),
        $._foreach_value
      ),
      ")",
      field("body", optional($._loop_body)),
      field("directive_end", "@endforeach")
    ),
    foreach_pair: ($) => seq($.expression, "=>", $._foreach_value),
    _foreach_value: ($) => choice(
      $.by_ref,
      $.expression,
      $.list_literal
    ),
    forelse_directive: ($) => seq(
      field("directive_start", "@forelse"),
      "(",
      $.expression,
      keyword("as"),
      choice(
        alias($.foreach_pair, $.pair),
        $._foreach_value
      ),
      ")",
      field("body", optional($._forelse_loop_body)),
      field("directive_end", "@endforelse")
    ),
    while_directive: ($) => seq(
      field("directive_start", "@while"),
      "(",
      field("condition", $.expression),
      ")",
      field("body", optional($._loop_body)),
      field("directive_end", "@endwhile")
    ),
    // !envoy
    envoy: ($) => choice($._task, $._story, $._hooks),
    _setup: ($) => seq(
      alias("@setup", $.directive_start),
      optional(alias($.text, $.php_only)),
      alias("@endsetup", $.directive_end)
    ),
    _task: ($) => seq(
      alias("@task", $.directive_start),
      $._envoy_directive_body,
      alias("@endtask", $.directive_end)
    ),
    _story: ($) => seq(
      alias("@story", $.directive_start),
      $._envoy_directive_body,
      alias("@endstory", $.directive_end)
    ),
    _hooks: ($) => choice(
      $._before,
      $._after,
      $._envoy_error,
      $._success,
      $._finished
    ),
    _before: ($) => seq(
      alias("@before", $.directive_start),
      optional(repeat($._notification)),
      alias("@endbefore", $.directive_end)
    ),
    _after: ($) => seq(
      alias("@after", $.directive_start),
      optional(repeat($._notification)),
      alias("@endafter", $.directive_end)
    ),
    _envoy_error: ($) => seq(
      alias("@error", $.directive_start),
      optional(repeat($._notification)),
      alias("@enderror", $.directive_end)
    ),
    _success: ($) => seq(
      alias("@success", $.directive_start),
      optional(repeat($._notification)),
      alias("@endsuccess", $.directive_end)
    ),
    _finished: ($) => seq(
      alias("@finished", $.directive_start),
      optional(repeat($._notification)),
      alias("@endfinished", $.directive_end)
    ),
    // !envoy:notification
    _notification: ($) => seq(
      alias(
        /@(slack|discord|telegram|microsoftTeams)/,
        $.directive
      ),
      $._directive_parameter
    ),
    // !livewire 🪼
    livewire: ($) => choice($._persist, $._teleport, $._volt, $._script, $._assets),
    _persist: ($) => seq(
      alias("@persist", $.directive_start),
      $._directive_parameter,
      repeat1(
        choice(
          $.entity,
          $.text,
          $.element,
          $.php_statement,
          $.conditional
        )
      ),
      alias("@endpersist", $.directive_end)
    ),
    _teleport: ($) => seq(
      alias("@teleport", $.directive_start),
      $._directive_parameter,
      repeat1(
        choice(
          ...nodes.without(
            $.doctype,
            $.envoy,
            $.fragment,
            $.section,
            $.once,
            $.verbatim,
            $.stack
          )
        )
      ),
      alias("@endteleport", $.directive_end)
    ),
    _volt: ($) => seq(
      alias("@volt", $.directive_start),
      $._directive_parameter,
      repeat1(
        choice(
          ...nodes.without(
            $.doctype,
            $.envoy,
            $.fragment,
            $.section,
            $.once,
            $.verbatim,
            $.stack
          )
        )
      ),
      alias("@endvolt", $.directive_end)
    ),
    _script: ($) => seq(
      alias("@script", $.directive_start),
      optional(repeat1(
        choice(
          ...nodes.without(
            $.doctype,
            $.envoy,
            $.fragment,
            $.section,
            $.once,
            $.verbatim,
            $.stack
          )
        )
      )),
      alias("@endscript", $.directive_end)
    ),
    _assets: ($) => seq(
      alias("@assets", $.directive_start),
      optional(repeat1(
        choice(
          ...nodes.without(
            $.doctype,
            $.envoy,
            $.fragment,
            $.section,
            $.once,
            $.verbatim,
            $.stack
          )
        )
      )),
      alias("@endassets", $.directive_end)
    ),
    /*-----------------------------------*
    /  Do NOT change below this line
    /  without running tests
    /  This is the engine
    /*----------------------------------*/
    // !conditional helpers
    _conditonal_body: ($) => repeat1(choice(...nodes.with($.conditional_keyword).all())),
    _conditional_directive_body: ($) => seq($._directive_parameter, optional($._conditonal_body)),
    _conditional_body_with_optional_parameter: ($) => seq(optional($._directive_parameter), $._conditonal_body),
    // ! envoy helpers
    _envoy_if: ($) => seq(
      alias("@if", $.directive_start),
      $._directive_parameter,
      choice($.conditional_keyword, $._envoy_body),
      alias("@endif", $.directive_end)
    ),
    _envoy_body: ($) => repeat1(choice($.text, $._envoy_if, $._escaped)),
    _envoy_directive_body: ($) => seq($._directive_parameter, optional($._envoy_body)),
    // !loop helpers
    _loop_body: ($) => repeat1(
      choice(
        ...nodes.with($._loop_operator).without(
          $.doctype,
          $.envoy,
          $.livewire,
          $.section,
          $.fragment,
          $.once,
          $.verbatim,
          $.stack
        )
      )
    ),
    _forelse_loop_body: ($) => repeat1(
      choice(
        ...nodes.with($._forelse_loop_operator).without(
          $.doctype,
          $.envoy,
          $.livewire,
          $.section,
          $.fragment,
          $.once,
          $.verbatim,
          $.stack
        )
      )
    ),
    _loop_directive_body: ($) => seq($._directive_parameter, optional($._loop_body)),
    _directive_parameter: ($) => seq("(", commaSep1($.expression), ")"),
    text: ($) => prec.right(repeat1($._text)),
    // hidden to reduce AST noise in php_only #39
    // It is selectively unhidden for other areas
    // Create alternative text rep for php_only
    _text: (_) => (
      // custom directive conflict resolution
      choice(
        token(prec(-1, /@[a-zA-Z\d]*[^\(-]/)),
        // orphan tags
        token(prec(-2, /[{}!@()?,-]/)),
        token(
          prec(
            -1,
            /[^\s(){!}@-]([^<>(){!}@,?]*[^<>{!}()@?,-])?/
            // general text
          )
        )
      )
    ),
    _singly_quoted_attribute_text: (_) => prec.right(
      repeat1(
        choice(
          token(prec(-2, /[{}]/)),
          token(prec(-1, /[^'{}]/))
        )
      )
    ),
    _doubly_quoted_attribute_text: (_) => prec.right(
      repeat1(
        choice(
          token(prec(-2, /[{}]/)),
          token(prec(-1, /[^"{}]/))
        )
      )
    ),
    // ! PHP Expression Grammar (from tree-sitter-php)
    expression: ($) => choice(
      $.augmented_assignment_expression,
      $.conditional_expression,
      $.assignment_expression,
      $.binary_expression,
      $._unary_expression
    ),
    match_expression: ($) => seq(
      keyword("match"),
      field("condition", $.parenthesized_expression),
      field("body", $.match_block)
    ),
    match_block: ($) => prec.left(
      seq(
        "{",
        commaSep(
          choice(
            $.match_conditional_expression,
            $.match_default_expression
          )
        ),
        optional(","),
        "}"
      )
    ),
    match_condition_list: ($) => seq(commaSep1($.expression), optional(",")),
    match_conditional_expression: ($) => seq(
      field("conditional_expressions", $.match_condition_list),
      "=>",
      field("return_expression", $.expression)
    ),
    match_default_expression: ($) => seq(
      keyword("default"),
      "=>",
      field("return_expression", $.expression)
    ),
    _expressions: ($) => choice(
      $.expression,
      $.sequence_expression
    ),
    sequence_expression: ($) => prec(
      PREC.COMMA,
      seq(
        $.expression,
        ",",
        choice($.sequence_expression, $.expression)
      )
    ),
    augmented_assignment_expression: ($) => prec.right(
      PREC.ASSIGNMENT,
      seq(
        field("left", $._variable),
        field(
          "operator",
          choice(
            "**=",
            "*=",
            "/=",
            "%=",
            "+=",
            "-=",
            ".=",
            "<<=",
            ">>=",
            "&=",
            "^=",
            "|=",
            "??="
          )
        ),
        field("right", $.expression)
      )
    ),
    conditional_expression: ($) => prec.left(
      PREC.TERNARY,
      seq(
        field("condition", $.expression),
        "?",
        field("body", optional($.expression)),
        ":",
        field("alternative", $.expression)
      )
    ),
    assignment_expression: ($) => seq(
      field("left", $._variable),
      "=",
      field("right", $.expression)
    ),
    binary_expression: ($) => choice(
      prec(
        PREC.INSTANCEOF,
        seq(
          field("left", $._unary_expression),
          field("operator", keyword("instanceof")),
          field("right", $._class_name_reference)
        )
      ),
      prec.right(
        PREC.NULL_COALESCE,
        seq(
          field("left", $.expression),
          field("operator", "??"),
          field("right", $.expression)
        )
      ),
      prec.right(
        PREC.EXPONENTIAL,
        seq(
          field("left", $.expression),
          field("operator", "**"),
          field("right", $.expression)
        )
      ),
      ...[
        [keyword("and"), PREC.LOGICAL_AND_2],
        [keyword("or"), PREC.LOGICAL_OR_2],
        [keyword("xor"), PREC.LOGICAL_XOR],
        ["||", PREC.LOGICAL_OR_1],
        ["&&", PREC.LOGICAL_AND_1],
        ["|", PREC.BITWISE_OR],
        ["^", PREC.BITWISE_XOR],
        ["&", PREC.BITWISE_AND],
        ["==", PREC.EQUALITY],
        ["!=", PREC.EQUALITY],
        ["<>", PREC.EQUALITY],
        ["===", PREC.EQUALITY],
        ["!==", PREC.EQUALITY],
        ["<", PREC.INEQUALITY],
        [">", PREC.INEQUALITY],
        ["<=", PREC.INEQUALITY],
        [">=", PREC.INEQUALITY],
        ["<=>", PREC.EQUALITY],
        ["|>", PREC.PIPE],
        [".", PREC.CONCAT],
        ["<<", PREC.SHIFT],
        [">>", PREC.SHIFT],
        ["+", PREC.PLUS],
        ["-", PREC.PLUS],
        ["*", PREC.TIMES],
        ["/", PREC.TIMES],
        ["%", PREC.TIMES]
        // @ts-ignore
      ].map(
        ([op, p]) => prec.left(
          p,
          seq(
            field("left", $.expression),
            // @ts-ignore
            field("operator", op),
            field("right", $.expression)
          )
        )
      )
    ),
    unary_op_expression: ($) => prec.left(
      PREC.NEG,
      seq(
        field("operator", choice("+", "-", "~", "!")),
        field("argument", $.expression)
      )
    ),
    update_expression: ($) => {
      const argument = field("argument", $._variable);
      const operator = field("operator", choice("--", "++"));
      return prec.left(
        PREC.INC,
        choice(
          seq(operator, argument),
          seq(argument, operator)
        )
      );
    },
    cast_expression: ($) => prec(
      PREC.CAST,
      seq(
        "(",
        field("type", $.cast_type),
        ")",
        field("value", $._unary_expression)
      )
    ),
    type: ($) => choice(
      $._types,
      $.union_type,
      $.intersection_type,
      $.disjunctive_normal_form_type
    ),
    _types: ($) => choice(
      $.optional_type,
      $.named_type,
      $.primitive_type
    ),
    named_type: ($) => choice(
      $.name,
      $.qualified_name,
      $.relative_name
    ),
    optional_type: ($) => seq(
      "?",
      choice(
        $.named_type,
        $.primitive_type
      )
    ),
    bottom_type: (_) => keyword("never", false),
    union_type: ($) => pipeSep1($._types),
    intersection_type: ($) => ampSep1($._types),
    disjunctive_normal_form_type: ($) => prec.dynamic(
      -1,
      pipeSep1(choice(
        seq("(", $.intersection_type, ")"),
        $._types
      ))
    ),
    primitive_type: (_) => token(prec(
      PREC.KEYWORD,
      choice(
        "array",
        "bool",
        keyword("callable", false),
        // not legal in property types
        keyword("false", false),
        "float",
        "int",
        keyword("iterable", false),
        keyword("mixed", false),
        "null",
        "object",
        "string",
        keyword("true", false),
        keyword("void", false)
      )
    )),
    cast_type: (_) => token(prec(
      PREC.KEYWORD,
      choice(
        keyword("array", false),
        keyword("binary", false),
        keyword("bool", false),
        keyword("boolean", false),
        keyword("double", false),
        keyword("float", false),
        keyword("int", false),
        keyword("integer", false),
        keyword("object", false),
        keyword("real", false),
        keyword("string", false),
        keyword("unset", false)
      )
    )),
    _return_type: ($) => seq(":", field("return_type", choice($.type, $.bottom_type))),
    _unary_expression: ($) => choice($.primary_expression, $.unary_op_expression, $.cast_expression),
    primary_expression: ($) => choice(
      $._variable,
      $.literal,
      $.print_intrinsic,
      $.array_creation_expression,
      $.parenthesized_expression,
      $.function_call_expression,
      $.scoped_call_expression,
      $.class_constant_access_expression,
      $.qualified_name,
      $.relative_name,
      $.name,
      $.update_expression,
      $.anonymous_function,
      $.arrow_function,
      $.object_creation_expression,
      $.throw_expression
    ),
    print_intrinsic: ($) => seq(
      token(prec(PREC.KEYWORD, keyword("print"))),
      $.expression
    ),
    throw_expression: ($) => seq(
      token(prec(PREC.KEYWORD, keyword("throw"))),
      $.expression
    ),
    anonymous_function: ($) => seq(
      $._anonymous_function_header,
      field(
        "body",
        seq(
          "{",
          alias($.text, $.php_only),
          "}"
        )
      )
    ),
    anonymous_function_use_clause: ($) => seq(
      keyword("use"),
      "(",
      commaSep1(choice($.by_ref, $.variable_name)),
      optional(","),
      ")"
    ),
    _anonymous_function_header: ($) => seq(
      optional(field("attributes", $.attribute_list)),
      optional(field("static_modifier", $.static_modifier)),
      keyword("function"),
      optional(field("reference_modifier", $.reference_modifier)),
      field("parameters", $.formal_parameters),
      optional($.anonymous_function_use_clause),
      optional($._return_type)
    ),
    _arrow_function_header: ($) => seq(
      optional(field("attributes", $.attribute_list)),
      optional(field("static_modifier", $.static_modifier)),
      keyword("fn"),
      optional(field("reference_modifier", $.reference_modifier)),
      field("parameters", $.formal_parameters),
      optional($._return_type)
    ),
    formal_parameters: ($) => seq(
      "(",
      commaSep(choice(
        $.simple_parameter,
        $.variadic_parameter,
        $.property_promotion_parameter
      )),
      optional(","),
      ")"
    ),
    reference_modifier: (_) => "&",
    static_modifier: (_) => keyword("static"),
    arrow_function: ($) => seq(
      $._arrow_function_header,
      "=>",
      field("body", $.expression)
    ),
    property_promotion_parameter: ($) => seq(
      optional(field("attributes", $.attribute_list)),
      field("visibility", $.visibility_modifier),
      field("readonly", optional($.readonly_modifier)),
      field("type", optional($.type)),
      // Note: callable is not a valid type here, but instead of complicating the parser, we defer this checking to any intelligence using the parser
      field("name", choice($.by_ref, $.variable_name)),
      optional(seq("=", field("default_value", $.expression))),
      optional(alias($.text, $.property_hook_list))
    ),
    simple_parameter: ($) => seq(
      optional(field("attributes", $.attribute_list)),
      field("type", optional($.type)),
      optional(field("reference_modifier", $.reference_modifier)),
      field("name", $.variable_name),
      optional(seq("=", field("default_value", $.expression)))
    ),
    variadic_parameter: ($) => seq(
      optional(field("attributes", $.attribute_list)),
      field("type", optional($.type)),
      optional(field("reference_modifier", $.reference_modifier)),
      "...",
      field("name", $.variable_name)
    ),
    _variable: ($) => choice(
      $.variable_name,
      $.member_access_expression,
      $.subscript_expression
    ),
    variable_name: ($) => seq("$", alias(/[a-zA-Z_][a-zA-Z0-9_]*/, $.name)),
    by_ref: ($) => seq("&", $._variable),
    _variable_member_access_expression: ($) => prec(
      PREC.MEMBER,
      seq(
        field("object", $._new_variable),
        "->",
        $._member_name
      )
    ),
    member_access_expression: ($) => prec(
      PREC.MEMBER,
      seq(
        field("object", $._dereferencable_expression),
        "->",
        $._member_name
      )
    ),
    _variable_nullsafe_member_access_expression: ($) => prec(
      PREC.MEMBER,
      seq(
        field("object", $._new_variable),
        "?->",
        $._member_name
      )
    ),
    nullsafe_member_access_expression: ($) => prec(
      PREC.MEMBER,
      seq(
        field("object", $._dereferencable_expression),
        "?->",
        $._member_name
      )
    ),
    final_modifier: (_) => keyword("final"),
    abstract_modifier: (_) => keyword("abstract"),
    readonly_modifier: (_) => keyword("readonly"),
    visibility_modifier: ($) => seq(
      choice(
        keyword("public"),
        keyword("protected"),
        keyword("private")
      ),
      optional(seq(
        token.immediate("("),
        alias($.name, $.operation),
        token.immediate(")")
      ))
    ),
    subscript_expression: ($) => seq(
      field("object", $._dereferencable_expression),
      "[",
      optional($.expression),
      "]"
    ),
    _variable_subscript_expression: ($) => seq(
      $._new_variable,
      seq("[", optional($.expression), "]")
    ),
    _dereferencable_subscript_expression: ($) => seq(
      $._dereferencable_expression,
      seq("[", optional($.expression), "]")
    ),
    _variable_scoped_property_access_expression: ($) => prec(
      PREC.MEMBER,
      seq(
        field("scope", choice($._name, $._new_variable)),
        "::",
        field("name", $._simple_variable)
      )
    ),
    scoped_property_access_expression: ($) => prec(
      PREC.MEMBER,
      seq(
        field("scope", $._scope_resolution_qualifier),
        "::",
        field("name", $._simple_variable)
      )
    ),
    _member_name: ($) => choice(
      field("name", choice($.name, $._simple_variable)),
      seq("{", field("name", $.expression), "}")
    ),
    _dereferencable_expression: ($) => prec(
      PREC.DEREF,
      choice(
        $._variable,
        $.parenthesized_expression,
        $.array_creation_expression
      )
    ),
    _dereferencable_scalar: ($) => prec(
      PREC.DEREF,
      choice(
        $.array_creation_expression,
        $._string
      )
    ),
    list_literal: ($) => choice($._list_destructing, $._array_destructing),
    _list_destructing: ($) => seq(
      keyword("list"),
      "(",
      commaSep1(optional(
        choice(
          alias($._list_destructing, $.list_literal),
          $._variable,
          $.by_ref,
          seq(
            $.expression,
            "=>",
            choice(
              alias($._list_destructing, $.list_literal),
              $._variable,
              $.by_ref
            )
          )
        )
      )),
      ")"
    ),
    _array_destructing: ($) => seq(
      "[",
      commaSep1(optional($._array_destructing_element)),
      "]"
    ),
    _array_destructing_element: ($) => choice(
      choice(
        alias($._array_destructing, $.list_literal),
        $._variable,
        $.by_ref
      ),
      seq(
        $.expression,
        "=>",
        choice(
          alias($._array_destructing, $.list_literal),
          $._variable,
          $.by_ref
        )
      )
    ),
    parenthesized_expression: ($) => seq("(", $.expression, ")"),
    function_call_expression: ($) => seq(
      field("function", choice($.name, $._callable_expression)),
      field("arguments", $.arguments)
    ),
    _callable_expression: ($) => choice(
      $._callable_variable,
      $.parenthesized_expression,
      $._dereferencable_scalar,
      alias($._new_dereferencable_expression, $.object_creation_expression)
    ),
    scoped_call_expression: ($) => prec(
      PREC.CALL,
      seq(
        field("scope", $._scope_resolution_qualifier),
        "::",
        $._member_name,
        field("arguments", $.arguments)
      )
    ),
    _scope_resolution_qualifier: ($) => choice(
      $.relative_scope,
      $._name,
      $._dereferencable_expression
    ),
    relative_scope: (_) => prec(
      PREC.SCOPE,
      choice(
        keyword("self"),
        keyword("parent"),
        keyword("static")
      )
    ),
    arguments: ($) => seq("(", optional(seq(commaSep1($.argument), optional(","))), ")"),
    argument: ($) => seq(
      optional($._argument_name),
      choice($.expression, $.variadic_unpacking)
    ),
    _argument_name: ($) => seq(field("name", alias($.name, $.name)), ":"),
    member_call_expression: ($) => prec(
      PREC.CALL,
      seq(
        field("object", $._dereferencable_expression),
        "->",
        $._member_name,
        field("arguments", $.arguments)
      )
    ),
    nullsafe_member_call_expression: ($) => prec(
      PREC.CALL,
      seq(
        field("object", $._dereferencable_expression),
        "?->",
        $._member_name,
        field("arguments", $.arguments)
      )
    ),
    variadic_unpacking: ($) => seq("...", $.expression),
    class_constant_access_expression: ($) => seq(
      field("scope", $._scope_resolution_qualifier),
      "::",
      field("name", alias($.name, $.name))
    ),
    object_creation_expression: ($) => choice(
      $._new_dereferencable_expression,
      $._new_non_dereferencable_expression
    ),
    _new_non_dereferencable_expression: ($) => prec.right(
      PREC.NEW,
      seq(
        token(prec(PREC.NEW, keyword("new"))),
        $._class_name_reference
      )
    ),
    _new_dereferencable_expression: ($) => prec.right(
      PREC.NEW,
      seq(
        token(prec(PREC.NEW, keyword("new"))),
        seq($._class_name_reference, $.arguments)
      )
    ),
    qualified_name: ($) => seq(
      field("prefix", choice($.namespace_name, "\\")),
      $.name
    ),
    relative_name: ($) => seq(
      field(
        "prefix",
        seq(
          keyword("namespace"),
          optional(seq("\\", $.namespace_name)),
          "\\"
        )
      ),
      $.name
    ),
    _name: ($) => choice(
      alias(keyword("static", false), $.name),
      $.name,
      $.qualified_name
    ),
    _class_name_reference: ($) => choice(
      $._name,
      $._new_variable,
      $.parenthesized_expression
    ),
    dynamic_variable_name: ($) => choice(
      seq("$", $._simple_variable),
      seq("$", "{", $.expression, "}")
    ),
    _simple_variable: ($) => choice($.variable_name, $.dynamic_variable_name),
    _new_variable: ($) => prec(
      1,
      choice(
        $._simple_variable,
        alias($._variable_subscript_expression, $.subscript_expression),
        alias(
          $._variable_member_access_expression,
          $.member_access_expression
        ),
        alias(
          $._variable_nullsafe_member_access_expression,
          $.nullsafe_member_access_expression
        ),
        alias(
          $._variable_scoped_property_access_expression,
          $.scoped_property_access_expression
        )
      )
    ),
    _callable_variable: ($) => choice(
      $._simple_variable,
      alias($._dereferencable_subscript_expression, $.subscript_expression),
      $.member_call_expression,
      $.nullsafe_member_call_expression,
      $.function_call_expression,
      $.scoped_call_expression
    ),
    namespace_name: ($) => seq(
      alias(/[a-zA-Z_][a-zA-Z0-9_]*/, $.name),
      repeat1(seq("\\", alias(/[a-zA-Z_][a-zA-Z0-9_]*/, $.name)))
    ),
    array_creation_expression: ($) => choice(
      seq("[", commaSep($.array_element_initializer), optional(","), "]"),
      seq(
        "array",
        "(",
        commaSep($.array_element_initializer),
        optional(","),
        ")"
      )
    ),
    attribute_group: ($) => seq(
      "#[",
      commaSep1($.attribute),
      optional(","),
      "]"
    ),
    attribute_list: ($) => repeat1($.attribute_group),
    array_element_initializer: ($) => prec.right(choice(
      $.array_element_value_initializer,
      $.array_element_key_value_initializer,
      $.array_element_spreading_initializer
    )),
    array_element_value_initializer: ($) => $.expression,
    array_element_key_value_initializer: ($) => seq(
      field("key", $.expression),
      "=>",
      field("value", $.expression)
    ),
    array_element_spreading_initializer: ($) => seq("...", $.expression),
    literal: ($) => choice($.integer, $.float, $._string, $.boolean, $.null),
    integer: (_) => {
      const decimal = /[1-9]\d*(_\d+)*/;
      const octal = /0[oO]?[0-7]*(_[0-7]+)*/;
      const hex = /0[xX][0-9a-fA-F]+(_[0-9a-fA-F]+)*/;
      const binary = /0[bB][01]+(_[01]+)*/;
      return token(choice(
        decimal,
        octal,
        hex,
        binary
      ));
    },
    float: (_) => /\d*(_\d+)*((\.\d*(_\d+)*)?([eE][\+-]?\d+(_\d+)*)|(\.\d*(_\d+)*)([eE][\+-]?\d+(_\d+)*)?)/,
    _string: ($) => choice($.string, $.encapsed_string),
    string: (_) => seq(
      "'",
      repeat(choice(token(prec(1, /[^'\\]+/)), token.immediate("\\'"))),
      "'"
    ),
    encapsed_string: ($) => seq(
      '"',
      repeat(
        choice(
          token(prec(1, /[^"\\{]+/)),
          $.escape_sequence,
          seq($.variable_name, token(prec(1, /[^"\\]*/)))
        )
      ),
      '"'
    ),
    escape_sequence: (_) => token.immediate(
      seq(
        "\\",
        choice(
          "n",
          "r",
          "t",
          "\\",
          "$",
          '"',
          "'",
          /[0-7]{1,3}/,
          /x[0-9A-Fa-f]{1,2}/
        )
      )
    ),
    boolean: (_) => token(prec(PREC.KEYWORD, /true|false/i)),
    null: (_) => "null",
    name: (_) => token(prec(PREC.IDENTIFIER, /[a-zA-Z_][a-zA-Z0-9_]*/))
  }
});
export {
  grammar_default as default
};
/**
 * @file HTML grammar for tree-sitter
 * @author Max Brunsfeld <maxbrunsfeld@gmail.com>
 * @author Amaan Qureshi <amaanq12@gmail.com>
 * @license MIT
 */
/**
 * @file Blade grammar for tree-sitter
 * @author Emran Mashhadi Ramezan <2t5ukanu@duck.com>
 * @license MIT
 */
