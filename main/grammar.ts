/**
 * @file Blade grammar for tree-sitter
 * @author Emran Mashhadi Ramezan <2t5ukanu@duck.com>
 * @license MIT
 */

import NodeMap from "./NodeMap.ts";
import html from "../tree-sitter-html/grammar.js";

const nodes = new NodeMap();

/// <reference types="tree-sitter-cli/dsl" />

/**
 * Creates a rule to match one or more of the rules separated by a pipe
 */
function pipeSep1(rule: Rule): SeqRule {
  return seq(rule, repeat(seq("|", rule)));
}

/**
 * Creates a rule to  match one or more of the rules separated by an ampersand
 */
function ampSep1(rule: Rule): SeqRule {
  return seq(rule, repeat(seq(token("&"), rule)));
}

/**
 * Creates a regex that matches the given word case-insensitively,
 * and will alias the regex to the word if aliasAsWord is true
 */
function keyword(word: string, aliasAsWord = true): PrecRule {
  /** @type {RegExp|AliasRule} */
  let result: RegExp | AliasRule = new RegExp(word, "i");
  if (aliasAsWord) result = alias(result, word);
  return prec(PREC.KEYWORD, result);
}

const PREC = {
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
  COMMENT: 4,
};

function commaSep1(rule: Rule): SeqRule {
  return seq(rule, repeat(seq(",", rule)));
}

function commaSep(rule: Rule): ChoiceRule {
  return optional(commaSep1(rule));
}

const reserved_php = ($: GrammarSymbols<string>) => [
  $._kw_abstract,
  $._kw_and,
  $._kw_as,
  $._kw_break,
  $._kw_callable,
  $._kw_case,
  $._kw_catch,
  $._kw_class,
  $._kw_clone,
  $._kw_const,
  $._kw_continue,
  $._kw_declare,
  $._kw_default,
  $._kw_do,
  $._kw_echo,
  $._kw_else,
  $._kw_elseif,
  $._kw_enddeclare,
  $._kw_endfor,
  $._kw_endforeach,
  $._kw_endif,
  $._kw_endswitch,
  $._kw_endwhile,
  $._kw_extends,
  $._kw_final,
  $._kw_finally,
  $._kw_fn,
  $._kw_for,
  $._kw_foreach,
  $._kw_function,
  $._kw_global,
  $._kw_goto,
  $._kw_if,
  $._kw_implements,
  $._kw_instanceof,
  $._kw_insteadof,
  $._kw_interface,
  $._kw_match,
  $._kw_namespace,
  $._kw_new,
  $._kw_or,
  $._kw_print,
  $._kw_private,
  $._kw_protected,
  $._kw_public,
  $._kw_readonly,
  $._kw_return,
  $._kw_static,
  $._kw_switch,
  $._kw_throw,
  $._kw_trait,
  $._kw_try,
  $._kw_use,
  $._kw_var,
  $._kw_while,
  $._kw_xor,
  $._kw_yield_from,
  $._kw_yield,
];

const reserved_class = ($: GrammarSymbols<string>) => [
  $._kw_bool,
  $._kw_false,
  $._kw_float,
  $._kw_int,
  $._kw_iterable,
  $._kw_mixed,
  $._kw_never,
  $._kw_null,
  $._kw_object,
  $._kw_string,
  $._kw_true,
  $._kw_void,
];

export default grammar(html, {
  name: "blade",
  conflicts: ($) => [
    [$._array_destructing, $.array_creation_expression],
    [$.primary_expression, $._array_destructing_element],

    [$.type, $.union_type, $.intersection_type, $.disjunctive_normal_form_type],
    [$.union_type, $.disjunctive_normal_form_type],
    [$.intersection_type],

    [$.namespace_name],
    [$.if_statement],
  ],

  reserved: {
    nothing: (_) => [],
    php: reserved_php,
    classes: (
      $: GrammarSymbols<string>,
    ) => [...reserved_php($), ...reserved_class($)],
  },

  supertypes: ($) => [
    $.statement,
    $.expression,
    $.primary_expression,
    $.type,
    $.literal,
    $.php_statement,
    $.conditional,
    $.loops,
    $.attribute,
  ],

  rules: {
    // The entire grammar
    _node: ($) =>
      choice(
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
          $.inline_directive,
          $.wire_ui,
          $.props,
          $.comment,
          $.switch,
          $.loops,
          $.conditional,
          $.envoy,
          $.livewire,
          // nested
          $.fragment,
          $.section,
          $.once,
          $.verbatim,
          $.stack,
        ),
      ),
    // ------------------

    // https://stackoverflow.com/questions/13014947/regex-to-match-a-c-style-multiline-comment/36328890#36328890
    comment: (_) =>
      token(prec(PREC.COMMENT, seq("{{--", /[^-]*-+([^}-][^-]*-+)*/, "}}"))),

    // !keywords
    keyword: (_) =>
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
      ),

    // ! PHP Statements
    php_statement: ($) =>
      choice(
        $.escaped,
        $.unescaped,
        $.setup,
        $.inline_raw,
        $.multi_line_raw,
        $.php,
      ),

    // From tree-sitter-php
    php: ($) =>
      seq(
        $.php_tag,
        repeat($.statement),
        $.php_end_tag,
      ),

    php_tag: (_) => /<\?([pP][hH][pP]|=)?/,
    php_end_tag: (_) => "?>",
    // --------------------

    escaped: ($) =>
      seq(
        token(prec(PREC.ECHO, "{{")),
        optional(
          $.expression,
        ),
        token(prec(PREC.ECHO, "}}")),
      ),

    unescaped: ($) =>
      seq(
        token(prec(PREC.ECHO, "{!!")),
        optional(
          $.expression,
        ),
        token(prec(PREC.ECHO, "!!}")),
      ),

    inline_raw: ($) =>
      seq(
        field("directive", "@php"),
        field("parameter", $._directive_parameter),
      ),

    multi_line_raw: ($) =>
      seq(
        field("directive_start", "@php"),
        repeat(choice($.statement, $.entity)),
        field("directive_end", "@endphp"),
      ),

    // tree-sitter-html override
    attribute: ($) =>
      choice(
        $.blade_attribute,
        $.html_attribute,
        $.expression_attribute,
        $.short_attribute,
        $.php_statement,
        ...nodes.without(
          $.doctype,
          $.entity,
          $.text,
          $.element,
          $.script_element,
          $.style_element,
          $.erroneous_end_tag,
          $.fragment,
          $.section,
          $.once,
          $.verbatim,
          $.stack,
        ),
      ),
    attribute_name: (_) => token(prec(-1, /[^<>"'/=\s]+/)),

    attribute_value: (_) => token(prec(-1, /[^<>"'/=\s]+/)),
    quoted_attribute_value: ($) =>
      choice(
        seq(
          "'",
          optional(
            repeat(
              choice(
                $.php_statement,
                $.conditional,
                $.inline_directive,
                $.comment,
                alias($._singly_quoted_attribute_text, $.attribute_value),
              ),
            ),
          ),
          "'",
        ),
        seq(
          '"',
          optional(
            repeat(
              choice(
                $.php_statement,
                $.conditional,
                $.inline_directive,
                $.comment,
                alias($._doubly_quoted_attribute_text, $.attribute_value),
              ),
            ),
          ),
          '"',
        ),
      ),

    quoted_expression: ($) =>
      prec(
        2,
        choice(
          seq(
            "'",
            $.expression,
            "'",
          ),
          seq(
            '"',
            $.expression,
            '"',
          ),
        ),
      ),

    // utilised from tree-sitter-html
    html_attribute: ($) =>
      seq(
        $.attribute_name,
        optional(
          seq(
            "=",
            choice($.attribute_value, $.quoted_attribute_value),
          ),
        ),
      ),

    expression_attribute: ($) =>
      seq(
        $.expression_attribute_name,
        seq(
          "=",
          $.quoted_expression,
        ),
      ),

    expression_attribute_name: (_) => token(prec(0, /:[^$<>"'/=\s]+/)),

    short_attribute: ($) => prec(1, seq(":", $.variable_name)),

    // ! Conditional Blade Attribute Directives
    blade_attribute: ($) =>
      seq(
        choice(
          "@class",
          "@style",
          "@checked",
          "@selected",
          "@disabled",
          "@readonly",
          "@required",
        ),
        field("parameter", $._directive_parameter),
      ),

    // !inline directives
    inline_directive: ($) =>
      choice(
        seq(
          field(
            "directive",
            choice(
              "@include",
              "@includeIf",
              "@includeWhen",
              "@includeUnless",
              "@includeFirst",
              "@includeIsolated",
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
            ),
          ),
          field("parameter", $._directive_parameter),
        ),
      ),

    // WireUI
    wire_ui: ($) =>
      seq(
        "@wireUiScripts",
        field("parameter", optional($._wire_ui_param)),
      ),

    _wire_ui_param: ($) =>
      seq(
        "(",
        "[",
        commaSep(
          choice(
            $.array_element_initializer,
            $.wire_ui_script_attribute,
          ),
        ),
        optional(","),
        "]",
        ")",
      ),

    wire_ui_script_attribute: ($) =>
      seq(
        field("name", $.expression),
        ":",
        field("value", $.expression),
      ),

    props: ($) =>
      seq(
        "@props",
        "(",
        choice($._string, $.array_creation_expression),
        ")",
      ),

    // !nested directives

    fragment: ($) =>
      seq(
        field("directive_start", "@fragment"),
        field("parameter", $._directive_parameter),
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
                $.once,
              ),
            ),
          ),
        ),
        field("directive_end", "@endfragment"),
      ),

    // ! section
    section: ($) =>
      prec.left(
        seq(
          field("directive_start", "@section"),
          field("parameter", $._directive_parameter),
          optional(
            seq(
              repeat1(
                choice(
                  ...nodes.without(
                    $.doctype,
                    $.section,
                    $.once,
                    $.envoy,
                    $.fragment,
                  ),
                ),
              ),
              alias(/@(endsection|show)/, $.directive_end),
            ),
          ),
        ),
      ),

    once: ($) =>
      seq(
        field("directive_start", "@once"),
        optional(
          repeat1(
            choice(...nodes.without($.doctype, $.envoy, $.section)),
          ),
        ),
        field("directive_end", "@endonce"),
      ),

    verbatim: ($) =>
      seq(
        field("directive_start", "@verbatim"),
        optional(
          repeat1(
            choice(...nodes.without($.doctype, $.livewire, $.envoy)),
          ),
        ),
        field("directive_end", "@endverbatim"),
      ),

    stack: ($) =>
      choice(
        $._push,
        $._pushOnce,
        $._pushIf,
        $._prepend,
        $._prependOnce,
      ),

    _push: ($) =>
      seq(
        field("directive_start", "@push"),
        field("parameter", $._directive_parameter),
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
                $.verbatim,
              ),
            ),
          ),
        ),
        field("directive_end", "@endpush"),
      ),

    _pushOnce: ($) =>
      seq(
        field("directive_start", "@pushOnce"),
        field("parameter", $._directive_parameter),
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
                $.verbatim,
              ),
            ),
          ),
        ),
        field("directive_end", "@endPushOnce"),
      ),

    _pushIf: ($) =>
      seq(
        field("directive_start", "@pushIf"),
        field("parameter", $._directive_parameter),
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
                $.verbatim,
              ),
            ),
          ),
        ),
        field("directive_end", "@endPushIf"),
      ),

    _prepend: ($) =>
      seq(
        field("directive_start", "@prepend"),
        field("parameter", $._directive_parameter),
        optional(
          repeat1(
            choice(
              ...nodes.without(
                $.doctype,
                $.envoy,
                $.livewire,
                $.loops,
                $._loop_operator,
                $.conditional,
                $.stack,
                $.once,
                $.fragment,
                $.section,
                $.verbatim,
              ),
            ),
          ),
        ),
        field("directive_end", "@endprepend"),
      ),

    _prependOnce: ($) =>
      seq(
        field("directive_start", "@prependOnce"),
        field("parameter", $._directive_parameter),
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
                $.verbatim,
              ),
            ),
          ),
        ),
        field("directive_end", "@endPrependOnce"),
      ),

    // !Conditionals
    conditional: ($) =>
      choice(
        $.if,
        $.unless,
        $.isset,
        $.empty,
        $.auth,
        $.guest,
        $.production,
        $.env,
        $.hasSection,
        $.sectionMissing,
        $.error,
        $.authorization,
        $.feature,
        $.custom,
        $.session,
        $.context,
      ),

    session: ($) =>
      seq(
        field("directive_start", "@session"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endsession"),
      ),

    context: ($) =>
      seq(
        field("directive_start", "@context"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endcontext"),
      ),

    // used in the conditional body rules
    conditional_keyword: ($) =>
      choice(
        "@else",
        $.elseif,
      ),

    elseif: ($) =>
      seq(
        field("directive", choice("@elseif", /@else[a-zA-Z]+/)),
        field("parameter", $._directive_parameter),
      ),

    if: ($) =>
      seq(
        field("directive_start", "@if"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endif"),
      ),

    unless: ($) =>
      seq(
        field("directive_start", "@unless"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endunless"),
      ),

    isset: ($) =>
      seq(
        field("directive_start", "@isset"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endisset"),
      ),

    empty: ($) =>
      seq(
        field("directive_start", "@empty"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endempty"),
      ),

    auth: ($) =>
      seq(
        field("directive_start", "@auth"),
        field("parameter", optional($._directive_parameter)),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endauth"),
      ),

    guest: ($) =>
      seq(
        field("directive_start", "@guest"),
        field("parameter", optional($._directive_parameter)),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endguest"),
      ),

    production: ($) =>
      seq(
        field("directive_start", "@production"),
        optional(optional($.conditional_body)),
        field("directive_end", "@endproduction"),
      ),

    env: ($) =>
      seq(
        field("directive_start", "@env"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endenv"),
      ),

    hasSection: ($) =>
      seq(
        field("directive_start", "@hasSection"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endif"),
      ),

    sectionMissing: ($) =>
      seq(
        field("directive_start", "@sectionMissing"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endif"),
      ),

    error: ($) =>
      seq(
        field("directive_start", "@error"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@enderror"),
      ),

    // !Authorisation Directives
    authorization: ($) => choice($.can, $.canany, $.cannot),

    can: ($) =>
      seq(
        field("directive_start", "@can"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endcan"),
      ),

    cannot: ($) =>
      seq(
        field("directive_start", "@cannot"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endcannot"),
      ),

    canany: ($) =>
      seq(
        field("directive_start", "@canany"),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field("directive_end", "@endcanany"),
      ),

    // !Laravel Pennant
    feature: ($) =>
      seq(
        field("directive_start", "@feature"),
        seq(
          field("parameter", $._directive_parameter),
          optional($._feature_body),
        ),
        field("directive_end", "@endfeature"),
      ),

    else_feature: ($) =>
      seq(
        field("directive", "@elsefeature"),
        field("parameter", $._directive_parameter),
      ),

    _feature_body: ($) =>
      repeat1(
        choice(
          ...nodes.with(
            $.conditional_keyword,
            $.else_feature,
          ).all(),
        ),
      ),

    // !Custom if Statements
    custom: ($) =>
      seq(
        field(
          "directive_start",
          choice(
            /@unless[a-zA-Z\d]+/,
            token(prec(-1, /@[a-zA-Z\d]+/)),
          ),
        ),
        field("parameter", $._directive_parameter),
        field("body", optional($.conditional_body)),
        field(
          "directive_start",
          token(prec(1, /@end[a-zA-Z\d]+/)),
        ),
      ),

    // !switch
    switch: ($) =>
      seq(
        field("directive_start", "@switch"),
        field("parameter", $._directive_parameter),
        repeat($.case),
        optional(
          seq(
            "@default",
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
                  $.switch,
                ),
              ),
            ),
          ),
        ),
        field("directive_end", "@endswitch"),
      ),

    case: ($) =>
      seq(
        "@case",
        field("parameter", $._directive_parameter),
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
                $.switch,
              ),
            ),
          ),
        ),
        optional("@break"),
      ),

    loops: ($) =>
      choice(
        $.for_directive,
        $.foreach_directive,
        $.forelse_directive,
        $.while_directive,
      ),

    // !Loops
    _forelse_loop_operator: ($) =>
      choice(
        $._loop_operator,
        "@empty",
      ),

    _loop_operator: ($) => choice($.continue, $.break),

    continue: ($) =>
      seq("@continue", optional(field("parameter", $._directive_parameter))),

    break: ($) =>
      seq("@break", optional(field("parameter", $._directive_parameter))),

    for_directive: ($) =>
      seq(
        field("directive_start", "@for"),
        "(",
        field("initialize", optional($._expressions)),
        ";",
        field("condition", optional($._expressions)),
        ";",
        field("update", optional($._expressions)),
        ")",
        field("body", field("body", optional($._loop_body))),
        field("directive_end", "@endfor"),
      ),

    foreach_directive: ($) =>
      seq(
        field("directive_start", "@foreach"),
        "(",
        $.expression,
        $._kw_as,
        choice(
          alias($.foreach_pair, $.pair),
          $._foreach_value,
        ),
        ")",
        field("body", field("body", optional($._loop_body))),
        field("directive_end", "@endforeach"),
      ),

    foreach_pair: ($) => seq($.expression, "=>", $._foreach_value),

    _foreach_value: ($) =>
      choice(
        $.by_ref,
        $.expression,
        $.list_literal,
      ),

    forelse_directive: ($) =>
      seq(
        field("directive_start", "@forelse"),
        "(",
        $.expression,
        $._kw_as,
        choice(
          alias($.foreach_pair, $.pair),
          $._foreach_value,
        ),
        ")",
        field("body", field("body", optional($._forelse_loop_body))),
        field("directive_end", "@endforelse"),
      ),

    while_directive: ($) =>
      seq(
        field("directive_start", "@while"),
        "(",
        field("condition", $.expression),
        ")",
        field("body", field("body", optional($._loop_body))),
        field("directive_end", "@endwhile"),
      ),

    // !envoy
    envoy: ($) => choice($._task, $._story, $._hooks),

    setup: ($) =>
      seq(
        field("directive_start", "@setup"),
        repeat($.statement),
        field("directive_end", "@endsetup"),
      ),

    _task: ($) =>
      seq(
        field("directive_start", "@task"),
        $._envoy_directive_body,
        field("directive_end", "@endtask"),
      ),

    _story: ($) =>
      seq(
        field("directive_start", "@story"),
        $._envoy_directive_body,
        field("directive_end", "@endstory"),
      ),

    _hooks: ($) =>
      choice(
        $._before,
        $._after,
        $._envoy_error,
        $._success,
        $._finished,
      ),

    _before: ($) =>
      seq(
        field("directive_start", "@before"),
        optional(repeat($._notification)),
        field("directive_end", "@endbefore"),
      ),
    _after: ($) =>
      seq(
        field("_directive_start", "@after"),
        optional(repeat($._notification)),
        field("_directive_end", "@endafter"),
      ),
    _envoy_error: ($) =>
      seq(
        field("directive_start", "@error"),
        optional(repeat($._notification)),
        field("directive_end", "@enderror"),
      ),
    _success: ($) =>
      seq(
        field("directive_start", "@success"),
        optional(repeat($._notification)),
        field("directive_end", "@endsuccess"),
      ),
    _finished: ($) =>
      seq(
        field("directive_start", "@finished"),
        optional(repeat($._notification)),
        field("directive_end", "@endfinished"),
      ),

    // !envoy:notification
    _notification: ($) =>
      seq(
        alias(
          /@(slack|discord|telegram|microsoftTeams)/,
          $.directive,
        ),
        field("parameter", $._directive_parameter),
      ),
    // !livewire 🪼
    livewire: ($) =>
      choice($._persist, $._teleport, $._volt, $._script, $._assets),
    _persist: ($) =>
      seq(
        field("directive_start", "@persist"),
        field("parameter", $._directive_parameter),
        repeat1(
          choice(
            $.entity,
            $.text,
            $.element,
            $.php_statement,
            $.conditional,
          ),
        ),
        field("directive_end", "@endpersist"),
      ),
    _teleport: ($) =>
      seq(
        field("directive_start", "@teleport"),
        field("parameter", $._directive_parameter),
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        ),
        field("directive_end", "@endteleport"),
      ),
    _volt: ($) =>
      seq(
        field("directive_start", "@volt"),
        field("parameter", $._directive_parameter),
        repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        ),
        field("directive_end", "@endvolt"),
      ),
    _script: ($) =>
      seq(
        field("directive_start", "@script"),
        optional(repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        )),
        field("directive_end", "@endscript"),
      ),
    _assets: ($) =>
      seq(
        field("directive_start", "@assets"),
        optional(repeat1(
          choice(
            ...nodes.without(
              $.doctype,
              $.envoy,
              $.fragment,
              $.section,
              $.once,
              $.verbatim,
              $.stack,
            ),
          ),
        )),
        field("directive_end", "@endassets"),
      ),

    /*-----------------------------------*
    /  Do NOT change below this line
    /  without running tests
    /  This is the engine
    /*----------------------------------*/

    // !conditional helpers

    conditional_body: ($) =>
      repeat1(choice(...nodes.with($.conditional_keyword).all())),

    // ! envoy helpers
    _envoy_if: ($) =>
      seq(
        field("directive_start", "@if"),
        field("parameter", $._directive_parameter),
        choice($.conditional_keyword, $._envoy_body),
        field("directive_end", "@endif"),
      ),

    _envoy_body: ($) => repeat1(choice($.text, $._envoy_if, $.escaped)),
    _envoy_directive_body: ($) =>
      seq(field("parameter", $._directive_parameter), optional($._envoy_body)),

    // !loop helpers
    _loop_body: ($) =>
      repeat1(
        choice(
          ...nodes
            .with($._loop_operator)
            .without(
              $.doctype,
              $.envoy,
              $.livewire,
              $.section,
              $.fragment,
              $.once,
              $.verbatim,
              $.stack,
            ),
        ),
      ),

    _forelse_loop_body: ($) =>
      repeat1(
        choice(
          ...nodes
            .with($._forelse_loop_operator)
            .without(
              $.doctype,
              $.envoy,
              $.livewire,
              $.section,
              $.fragment,
              $.once,
              $.verbatim,
              $.stack,
            ),
        ),
      ),

    _directive_parameter: ($) =>
      prec(1, seq("(", commaSep1($.expression), ")")),

    text: ($) => prec.right(repeat1($._text)),
    // hidden to reduce AST noise in php_only #39
    // It is selectively unhidden for other areas

    // Create alternative text rep for php_only
    _text: (_) =>
      // custom directive conflict resolution
      choice(
        token(prec(-1, /@[a-zA-Z\d]*[^\(-]/)),
        // orphan tags
        token(prec(-2, /[{}!@()?,-]/)),
        token(
          prec(
            -1,
            /[^\s(){!}@-]([^<>(){!}@,?]*[^<>{!}()@?,-])?/, // general text
          ),
        ),
      ),

    _singly_quoted_attribute_text: (_) =>
      prec.right(
        repeat1(
          choice(
            token(prec(-2, /[{}]/)),
            token(prec(-1, /[^'{}]/)),
          ),
        ),
      ),
    _doubly_quoted_attribute_text: (_) =>
      prec.right(
        repeat1(
          choice(
            token(prec(-2, /[{}]/)),
            token(prec(-1, /[^"{}]/)),
          ),
        ),
      ),

    /**
     * The primary reserved keywords in PHP, but not in all contexts.
     *
     * @see https://www.php.net/manual/en/reserved.keywords.php
     */
    _kw_abstract: (_) => /abstract/i,
    _kw_and: (_) => /and/i,
    _kw_as: (_) => /as/i,
    _kw_break: (_) => /break/i,
    _kw_callable: (_) => /callable/i,
    _kw_case: (_) => /case/i,
    _kw_catch: (_) => /catch/i,
    _kw_class: (_) => /class/i,
    _kw_clone: (_) => /clone/i,
    _kw_const: (_) => /const/i,
    _kw_continue: (_) => /continue/i,
    _kw_declare: (_) => /declare/i,
    _kw_default: (_) => /default/i,
    _kw_do: (_) => /do/i,
    _kw_echo: (_) => /echo/i,
    _kw_else: (_) => /else/i,
    _kw_elseif: (_) => /elseif/i,
    _kw_enddeclare: (_) => /enddeclare/i,
    _kw_endfor: (_) => /endfor/i,
    _kw_endforeach: (_) => /endforeach/i,
    _kw_endif: (_) => /endif/i,
    _kw_endswitch: (_) => /endswitch/i,
    _kw_endwhile: (_) => /endwhile/i,
    _kw_extends: (_) => /extends/i,
    _kw_final: (_) => /final/i,
    _kw_finally: (_) => /finally/i,
    _kw_fn: (_) => /fn/i,
    _kw_for: (_) => /for/i,
    _kw_foreach: (_) => /foreach/i,
    _kw_function: (_) => /function/i,
    _kw_global: (_) => /global/i,
    _kw_goto: (_) => /goto/i,
    _kw_if: (_) => /if/i,
    _kw_implements: (_) => /implements/i,
    _kw_instanceof: (_) => /instanceof/i,
    _kw_insteadof: (_) => /insteadof/i,
    _kw_interface: (_) => /interface/i,
    _kw_match: (_) => /match/i,
    _kw_namespace: (_) => /namespace/i,
    _kw_new: (_) => /new/i,
    _kw_or: (_) => /or/i,
    _kw_print: (_) => /print/i,
    _kw_private: (_) => /private/i,
    _kw_protected: (_) => /protected/i,
    _kw_public: (_) => /public/i,
    _kw_readonly: (_) => /readonly/i,
    _kw_return: (_) => /return/i,
    _kw_static: (_) => /static/i,
    _kw_switch: (_) => /switch/i,
    _kw_throw: (_) => /throw/i,
    _kw_trait: (_) => /trait/i,
    _kw_try: (_) => /try/i,
    _kw_use: (_) => /use/i,
    _kw_var: (_) => /var/i,
    _kw_while: (_) => /while/i,
    _kw_xor: (_) => /xor/i,
    _kw_yield_from: (_) => /yield from/i,
    _kw_yield: (_) => /yield/i,

    _kw_bool: (_) => /bool/i,
    _kw_false: (_) => /false/i,
    _kw_float: (_) => /float/i,
    _kw_int: (_) => /int/i,
    _kw_iterable: (_) => /iterable/i,
    _kw_mixed: (_) => /mixed/i,
    _kw_never: (_) => /never/i,
    _kw_null: (_) => /null/i,
    _kw_object: (_) => /object/i,
    _kw_string: (_) => /string/i,
    _kw_true: (_) => /true/i,
    _kw_void: (_) => /void/i,

    // ! PHP Expression Grammar (from tree-sitter-php)
    expression: ($) =>
      reserved(
        "php",
        choice(
          $.conditional_expression,
          $.match_expression,
          $.augmented_assignment_expression,
          $.assignment_expression,
          $.reference_assignment_expression,
          $.yield_expression,
          $._unary_expression,
          $.error_suppression_expression,
          $.binary_expression,
        ),
      ),

    error_suppression_expression: ($) => prec(PREC.INC, seq("@", $.expression)),

    yield_expression: ($) =>
      prec.right(choice(
        seq($._kw_yield, optional($.array_element_initializer)),
        seq($._kw_yield_from, $.expression),
      )),

    reference_assignment_expression: ($) =>
      prec.right(
        PREC.ASSIGNMENT,
        seq(
          field(
            "left",
            choice(
              $._variable,
              $.list_literal,
            ),
          ),
          "=",
          "&",
          field("right", $.expression),
        ),
      ),

    match_expression: ($) =>
      seq(
        $._kw_match,
        field("condition", $.parenthesized_expression),
        field("body", $.match_block),
      ),

    match_block: ($) =>
      prec.left(
        seq(
          "{",
          commaSep(
            choice(
              $.match_conditional_expression,
              $.match_default_expression,
            ),
          ),
          optional(","),
          "}",
        ),
      ),

    match_condition_list: ($) => seq(commaSep1($.expression), optional(",")),

    match_conditional_expression: ($) =>
      seq(
        field("conditional_expressions", $.match_condition_list),
        "=>",
        field("return_expression", $.expression),
      ),

    match_default_expression: ($) =>
      seq(
        $._kw_default,
        "=>",
        field("return_expression", $.expression),
      ),

    return_statement: ($) =>
      seq(
        $._kw_return,
        optional($.expression),
        $._semicolon,
      ),

    while_statement: ($) =>
      seq(
        $._kw_while,
        field("condition", $.parenthesized_expression),
        choice(
          field("body", $.statement),
          seq(
            field("body", $.colon_block),
            $._kw_endwhile,
            $._semicolon,
          ),
        ),
      ),

    do_statement: ($) =>
      seq(
        $._kw_do,
        field("body", $.statement),
        $._kw_while,
        field("condition", $.parenthesized_expression),
        $._semicolon,
      ),

    for_statement: ($) =>
      seq(
        $._kw_for,
        "(",
        field("initialize", optional($._expressions)),
        ";",
        field("condition", optional($._expressions)),
        ";",
        field("update", optional($._expressions)),
        ")",
        choice(
          $._semicolon,
          field("body", $.statement),
          seq(
            ":",
            field("body", repeat($.statement)),
            $._kw_endfor,
            $._semicolon,
          ),
        ),
      ),

    foreach_statement: ($) =>
      seq(
        $._kw_foreach,
        "(",
        $.expression,
        $._kw_as,
        choice(
          alias($.foreach_pair, $.pair),
          $._foreach_value,
        ),
        ")",
        choice(
          $._semicolon,
          field("body", $.statement),
          seq(
            field("body", $.colon_block),
            $._kw_endforeach,
            $._semicolon,
          ),
        ),
      ),

    try_statement: ($) =>
      seq(
        $._kw_try,
        field("body", $.compound_statement),
        repeat1(choice($.catch_clause, $.finally_clause)),
      ),

    catch_clause: ($) =>
      seq(
        $._kw_catch,
        "(",
        field("type", $.type_list),
        optional(field("name", $.variable_name)),
        ")",
        field("body", $.compound_statement),
      ),

    type_list: ($) => pipeSep1($.named_type),

    finally_clause: ($) =>
      seq(
        $._kw_finally,
        field("body", $.compound_statement),
      ),

    goto_statement: ($) =>
      seq(
        $._kw_goto,
        $.name,
        $._semicolon,
      ),

    continue_statement: ($) =>
      seq(
        $._kw_continue,
        optional($.expression),
        $._semicolon,
      ),

    break_statement: ($) =>
      seq(
        $._kw_break,
        optional($.expression),
        $._semicolon,
      ),

    _expressions: ($) =>
      choice(
        $.expression,
        $.sequence_expression,
      ),

    sequence_expression: ($) =>
      prec(
        PREC.COMMA,
        seq(
          $.expression,
          ",",
          choice($.sequence_expression, $.expression),
        ),
      ),

    augmented_assignment_expression: ($) =>
      prec.right(
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
              "??=",
            ),
          ),
          field("right", $.expression),
        ),
      ),

    conditional_expression: ($) =>
      prec.left(
        PREC.TERNARY,
        seq(
          field("condition", $.expression),
          "?",
          field("body", optional($.expression)),
          ":",
          field("alternative", $.expression),
        ),
      ),

    assignment_expression: ($) =>
      prec.right(
        PREC.ASSIGNMENT,
        seq(
          field(
            "left",
            choice(
              $._variable,
              $.list_literal,
            ),
          ),
          "=",
          field("right", $.expression),
        ),
      ),

    binary_expression: ($) =>
      choice(
        prec(
          PREC.INSTANCEOF,
          seq(
            field("left", $._unary_expression),
            field("operator", $._kw_instanceof),
            field("right", $._class_name_reference),
          ),
        ),
        prec.right(
          PREC.NULL_COALESCE,
          seq(
            field("left", $.expression),
            field("operator", "??"),
            field("right", $.expression),
          ),
        ),
        prec.right(
          PREC.EXPONENTIAL,
          seq(
            field("left", $.expression),
            field("operator", "**"),
            field("right", $.expression),
          ),
        ),
        ...[
          [$._kw_and, PREC.LOGICAL_AND_2],
          [$._kw_or, PREC.LOGICAL_OR_2],
          [$._kw_xor, PREC.LOGICAL_XOR],
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
          ["%", PREC.TIMES],
          // @ts-ignore
        ].map(([op, p]: [RegExp | AliasRule | string, number]) =>
          prec.left(
            p,
            seq(
              field("left", $.expression),
              // @ts-ignore
              field("operator", op),
              field("right", $.expression),
            ),
          )
        ),
      ),

    unary_op_expression: ($) =>
      prec.left(
        PREC.NEG,
        seq(
          field("operator", choice("+", "-", "~", "!")),
          field("argument", $.expression),
        ),
      ),

    update_expression: ($) => {
      const argument = field("argument", $._variable);
      const operator = field("operator", choice("--", "++"));
      return prec.left(
        PREC.INC,
        choice(
          seq(operator, argument),
          seq(argument, operator),
        ),
      );
    },

    cast_expression: ($) =>
      prec(
        PREC.CAST,
        seq(
          "(",
          field("type", $.cast_type),
          ")",
          field("value", $._unary_expression),
        ),
      ),

    type: ($) =>
      choice(
        $._types,
        $.union_type,
        $.intersection_type,
        $.disjunctive_normal_form_type,
      ),

    _types: ($) =>
      choice(
        $.optional_type,
        $.named_type,
        $.primitive_type,
      ),

    named_type: ($) =>
      choice(
        reserved("classes", $.name),
        $.qualified_name,
        $.relative_name,
      ),

    optional_type: ($) =>
      seq(
        "?",
        choice(
          $.named_type,
          $.primitive_type,
        ),
      ),

    bottom_type: ($) => $._kw_never,

    union_type: ($) => pipeSep1($._types),

    intersection_type: ($) => ampSep1($._types),

    disjunctive_normal_form_type: ($) =>
      prec.dynamic(
        -1,
        pipeSep1(choice(
          seq("(", $.intersection_type, ")"),
          $._types,
        )),
      ),

    primitive_type: ($) => {
      const ss = [
        "array",
        "bool",
        "float",
        "int",
        "null",
        "object",
        "string",
      ];
      return choice(
        ...ss.map((s) => token(prec(PREC.KEYWORD, s))),
        $._kw_callable, // not legal in property types
        $._kw_false,
        $._kw_iterable,
        $._kw_mixed,
        $._kw_true,
        $._kw_void,
      );
    },

    cast_type: ($) => {
      const pats = [
        /array/i,
        /binary/i,
        /boolean/i,
        /double/i,
        /integer/i,
        /real/i,
        /unset/i,
      ].map((pat) => token(prec(PREC.KEYWORD, pat)));

      return choice(
        ...pats,
        $._kw_bool,
        $._kw_float,
        $._kw_int,
        $._kw_object,
        $._kw_string,
      );
    },

    _return_type: ($) =>
      seq(":", field("return_type", choice($.type, $.bottom_type))),
    _const_element: ($) => seq($.name, "=", $.expression),
    _class_const_element: ($) =>
      seq(reserved("nothing", $.name), "=", $.expression),

    _unary_expression: ($) =>
      choice(
        $.clone_expression,
        $.primary_expression,
        $.unary_op_expression,
        $.cast_expression,
      ),

    clone_expression: ($) => seq($._kw_clone, $.primary_expression),

    primary_expression: ($) =>
      choice(
        $._variable,
        $.literal,
        $.class_constant_access_expression,
        $.qualified_name,
        $.relative_name,
        $.name,
        $.array_creation_expression,
        $.print_intrinsic,
        $.anonymous_function,
        $.arrow_function,
        $.object_creation_expression,
        $.update_expression,
        $.parenthesized_expression,
        $.throw_expression,
      ),

    print_intrinsic: ($) =>
      seq(
        $._kw_print,
        $.expression,
      ),

    throw_expression: ($) =>
      seq(
        $._kw_throw,
        $.expression,
      ),

    function_definition: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        $._kw_function,
        optional($.reference_modifier),
        field("name", $.name),
        field("parameters", $.formal_parameters),
        optional($._return_type),
        field("body", $.compound_statement),
      ),

    anonymous_function: ($) =>
      seq(
        $._anonymous_function_header,
        field(
          "body",
          $.compound_statement,
        ),
      ),

    anonymous_function_use_clause: ($) =>
      seq(
        $._kw_use,
        "(",
        commaSep1(choice($.by_ref, $.variable_name)),
        optional(","),
        ")",
      ),

    _modifier: ($) =>
      prec.left(choice(
        $.var_modifier,
        $.visibility_modifier,
        $.static_modifier,
        $.final_modifier,
        $.abstract_modifier,
        $.readonly_modifier,
      )),

    _anonymous_function_header: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        optional(field("static_modifier", $.static_modifier)),
        $._kw_function,
        optional(field("reference_modifier", $.reference_modifier)),
        field("parameters", $.formal_parameters),
        optional($.anonymous_function_use_clause),
        optional($._return_type),
      ),

    _arrow_function_header: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        optional(field("static_modifier", $.static_modifier)),
        $._kw_fn,
        optional(field("reference_modifier", $.reference_modifier)),
        field("parameters", $.formal_parameters),
        optional($._return_type),
      ),

    formal_parameters: ($) =>
      seq(
        "(",
        commaSep(choice(
          $.simple_parameter,
          $.variadic_parameter,
          $.property_promotion_parameter,
        )),
        optional(","),
        ")",
      ),

    reference_modifier: (_) => "&",
    static_modifier: ($) => alias($._kw_static, $.static),
    var_modifier: ($) => $._kw_var,

    arrow_function: ($) =>
      seq(
        $._arrow_function_header,
        "=>",
        field("body", $.expression),
      ),

    property_promotion_parameter: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        field("visibility", $.visibility_modifier),
        field("readonly", optional($.readonly_modifier)),
        field("type", optional($.type)), // Note: callable is not a valid type here, but instead of complicating the parser, we defer this checking to any intelligence using the parser
        field("name", choice($.by_ref, $.variable_name)),
        optional(seq("=", field("default_value", $.expression))),
        optional(alias($.text, $.property_hook_list)),
      ),

    simple_parameter: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        field("type", optional($.type)),
        optional(field("reference_modifier", $.reference_modifier)),
        field("name", $.variable_name),
        optional(seq("=", field("default_value", $.expression))),
      ),

    variadic_parameter: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        field("type", optional($.type)),
        optional(field("reference_modifier", $.reference_modifier)),
        "...",
        field("name", $.variable_name),
      ),

    _variable: ($) =>
      prec.right(
        choice(
          alias($.cast_variable, $.cast_expression),
          $._new_variable,
          $._callable_variable,
          $.scoped_property_access_expression,
          $.member_access_expression,
          $.nullsafe_member_access_expression,
        ),
      ),

    cast_variable: ($) =>
      prec(
        PREC.CAST,
        seq(
          "(",
          field("type", $.cast_type),
          ")",
          field("value", $._variable),
        ),
      ),

    variable_name: ($) => seq("$", reserved("nothing", $.name)),

    by_ref: ($) => seq("&", $._variable),

    _variable_member_access_expression: ($) =>
      prec(
        PREC.MEMBER,
        seq(
          field("object", $._new_variable),
          "->",
          $._member_name,
        ),
      ),

    member_access_expression: ($) =>
      prec(
        PREC.MEMBER,
        seq(
          field("object", $._dereferencable_expression),
          "->",
          $._member_name,
        ),
      ),

    _variable_nullsafe_member_access_expression: ($) =>
      prec(
        PREC.MEMBER,
        seq(
          field("object", $._new_variable),
          "?->",
          $._member_name,
        ),
      ),

    nullsafe_member_access_expression: ($) =>
      prec(
        PREC.MEMBER,
        seq(
          field("object", $._dereferencable_expression),
          "?->",
          $._member_name,
        ),
      ),

    final_modifier: ($) => $._kw_final,
    abstract_modifier: ($) => $._kw_abstract,
    readonly_modifier: ($) => $._kw_readonly,

    visibility_modifier: ($) =>
      seq(
        choice(
          $._kw_public,
          $._kw_protected,
          $._kw_private,
        ),
        optional(seq(
          token.immediate("("),
          alias($.name, $.operation),
          token.immediate(")"),
        )),
      ),

    subscript_expression: ($) =>
      seq(
        field("object", $._dereferencable_expression),
        "[",
        optional($.expression),
        "]",
      ),

    _variable_subscript_expression: ($) =>
      seq(
        $._new_variable,
        seq("[", optional($.expression), "]"),
      ),

    _dereferencable_subscript_expression: ($) =>
      seq(
        $._dereferencable_expression,
        seq("[", optional($.expression), "]"),
      ),

    _variable_scoped_property_access_expression: ($) =>
      prec(
        PREC.MEMBER,
        seq(
          field("scope", choice($._name, $._new_variable)),
          "::",
          field("name", $._simple_variable),
        ),
      ),

    scoped_property_access_expression: ($) =>
      prec(
        PREC.MEMBER,
        seq(
          field("scope", $._scope_resolution_qualifier),
          "::",
          field("name", $._simple_variable),
        ),
      ),

    _member_name: ($) =>
      choice(
        field("name", choice(reserved("nothing", $.name), $._simple_variable)),
        seq("{", field("name", $.expression), "}"),
      ),

    _dereferencable_expression: ($) =>
      prec(
        PREC.DEREF,
        choice(
          $._variable,
          $.function_call_expression,
          $.member_call_expression,
          $.nullsafe_member_call_expression,
          $.class_constant_access_expression,
          $.parenthesized_expression,
          $.array_creation_expression,
          $._name,
        ),
      ),

    _dereferencable_scalar: ($) =>
      prec(
        PREC.DEREF,
        choice(
          $.array_creation_expression,
          $._string,
        ),
      ),

    list_literal: ($) => choice($._list_destructing, $._array_destructing),

    _list_destructing: ($) =>
      seq(
        /list/i,
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
                $.by_ref,
              ),
            ),
          ),
        )),
        ")",
      ),

    _array_destructing: ($) =>
      seq(
        "[",
        commaSep1(optional($._array_destructing_element)),
        "]",
      ),

    _array_destructing_element: ($) =>
      choice(
        choice(
          alias($._array_destructing, $.list_literal),
          $._variable,
          $.by_ref,
        ),
        seq(
          $.expression,
          "=>",
          choice(
            alias($._array_destructing, $.list_literal),
            $._variable,
            $.by_ref,
          ),
        ),
      ),

    parenthesized_expression: ($) => seq("(", $.expression, ")"),

    function_call_expression: ($) =>
      seq(
        field("function", choice($.name, $._callable_expression)),
        field("arguments", $.arguments),
      ),

    _callable_expression: ($) =>
      choice(
        $._callable_variable,
        $.parenthesized_expression,
        $._dereferencable_scalar,
        alias($._new_dereferencable_expression, $.object_creation_expression),
      ),

    scoped_call_expression: ($) =>
      prec(
        PREC.CALL,
        seq(
          field("scope", $._scope_resolution_qualifier),
          "::",
          $._member_name,
          field("arguments", $.arguments),
        ),
      ),

    _scope_resolution_qualifier: ($) =>
      choice(
        $.relative_scope,
        $._name,
        $._dereferencable_expression,
      ),

    relative_scope: ($) =>
      prec(
        PREC.SCOPE,
        choice(
          alias(/self/i, $.self),
          alias(/parent/i, $.parent),
          alias($._kw_static, $.static),
        ),
      ),

    arguments: ($) =>
      prec(
        PREC.CALL,
        seq("(", optional(seq(commaSep1($.argument), optional(","))), ")"),
      ),

    argument: ($) =>
      seq(
        optional($._argument_name),
        choice($.expression, $.variadic_unpacking),
      ),

    _argument_name: ($) =>
      seq(
        field(
          "name",
          alias(
            choice(
              reserved("nothing", $.name),
              /array/i,
              $._kw_fn,
              $._kw_function,
              $._kw_match,
              $._kw_namespace,
              $._kw_null,
              $._kw_static,
              $._kw_throw,
              /parent/i,
              /self/i,
              /true|false/i,
            ),
            $.name,
          ),
        ),
        ":",
      ),

    member_call_expression: ($) =>
      prec(
        PREC.CALL,
        seq(
          field("object", $._dereferencable_expression),
          "->",
          $._member_name,
          field("arguments", $.arguments),
        ),
      ),

    nullsafe_member_call_expression: ($) =>
      prec(
        PREC.CALL,
        seq(
          field("object", $._dereferencable_expression),
          "?->",
          $._member_name,
          field("arguments", $.arguments),
        ),
      ),

    variadic_unpacking: ($) => seq("...", $.expression),

    class_constant_access_expression: ($) =>
      seq(
        field("scope", $._scope_resolution_qualifier),
        "::",
        choice(
          reserved("nothing", $.name),
          seq("{", alias($.expression, $.name), "}"),
        ),
      ),

    object_creation_expression: ($) =>
      choice(
        $._new_dereferencable_expression,
        $._new_non_dereferencable_expression,
      ),

    _new_non_dereferencable_expression: ($) =>
      prec.right(
        PREC.NEW,
        seq(
          $._kw_new,
          $._class_name_reference,
        ),
      ),

    _new_dereferencable_expression: ($) =>
      prec.right(
        PREC.NEW,
        seq(
          $._kw_new,
          seq($._class_name_reference, $.arguments),
        ),
      ),

    relative_name: ($) =>
      seq(
        field(
          "prefix",
          seq(
            $._kw_namespace,
            optional(seq("\\", $.namespace_name)),
            "\\",
          ),
        ),
        reserved("classes", $.name),
      ),

    _name: ($) =>
      prec(
        PREC.IDENTIFIER,
        choice(
          alias($._kw_static, $.name),
          reserved("classes", $.name),
          $.qualified_name,
        ),
      ),

    _class_name_reference: ($) =>
      choice(
        $._name,
        $._new_variable,
        $.parenthesized_expression,
      ),

    dynamic_variable_name: ($) =>
      choice(
        seq("$", $._simple_variable),
        seq("$", "{", $.expression, "}"),
      ),

    _simple_variable: ($) => choice($.variable_name, $.dynamic_variable_name),

    _new_variable: ($) =>
      prec(
        1,
        choice(
          $._simple_variable,
          alias($._variable_subscript_expression, $.subscript_expression),
          alias(
            $._variable_member_access_expression,
            $.member_access_expression,
          ),
          alias(
            $._variable_nullsafe_member_access_expression,
            $.nullsafe_member_access_expression,
          ),
          alias(
            $._variable_scoped_property_access_expression,
            $.scoped_property_access_expression,
          ),
        ),
      ),

    _callable_variable: ($) =>
      prec(
        PREC.CALL,
        choice(
          $._simple_variable,
          alias($._dereferencable_subscript_expression, $.subscript_expression),
          $.member_call_expression,
          $.nullsafe_member_call_expression,
          $.function_call_expression,
          $.scoped_call_expression,
        ),
      ),

    namespace_name: ($) =>
      seq(
        reserved("nothing", $.name),
        repeat(seq("\\", reserved("nothing", $.name))),
      ),

    qualified_name: ($) =>
      seq(
        field("prefix", seq(optional("\\"), optional($.namespace_name), "\\")),
        reserved("classes", $.name),
      ),

    array_creation_expression: ($) =>
      choice(
        seq("[", commaSep($.array_element_initializer), optional(","), "]"),
        seq(
          "array",
          "(",
          commaSep($.array_element_initializer),
          optional(","),
          ")",
        ),
      ),

    attr_group: ($) =>
      seq(
        "#[",
        commaSep1($.attr),
        optional(","),
        "]",
      ),

    attr_list: ($) => repeat1($.attr_group),

    attr: ($) =>
      seq(
        $._name,
        optional(field("parameters", $.arguments)),
      ),

    array_element_initializer: ($) =>
      prec.right(choice(
        $.array_element_value_initializer,
        $.array_element_key_value_initializer,
        $.array_element_spreading_initializer,
      )),

    array_element_value_initializer: ($) => $.expression,
    array_element_key_value_initializer: ($) =>
      prec(
        -1,
        seq(
          field("key", $.expression),
          "=>",
          field("value", $.expression),
        ),
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
        binary,
      ));
    },

    float: (_) =>
      /\d*(_\d+)*((\.\d*(_\d+)*)?([eE][\+-]?\d+(_\d+)*)|(\.\d*(_\d+)*)([eE][\+-]?\d+(_\d+)*)?)/,

    _string: ($) => choice($.string, $.encapsed_string),

    string: (_) =>
      seq(
        "'",
        repeat(choice(token(prec(3, /(\\.|[^'\\])+/)), token.immediate("\\'"))),
        "'",
      ),

    encapsed_string: ($) =>
      seq(
        '"',
        repeat(
          choice(
            token(prec(1, /[^"\\{]+/)),
            $.escape_sequence,
            seq($.variable_name, token(prec(1, /[^"\\]*/))),
          ),
        ),
        '"',
      ),

    escape_sequence: (_) =>
      token.immediate(
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
            /x[0-9A-Fa-f]{1,2}/,
          ),
        ),
      ),

    boolean: ($) => choice($._kw_true, $._kw_false),

    null: ($) => $._kw_null,

    name: (_) => token(/[a-zA-Z_][a-zA-Z0-9_]*/),

    statement: ($) =>
      choice(
        $.empty_statement,
        $.compound_statement,
        $.named_label_statement,
        $.expression_statement,
        $.if_statement,
        $.switch_statement,
        $.while_statement,
        $.do_statement,
        $.for_statement,
        $.foreach_statement,
        $.goto_statement,
        $.continue_statement,
        $.break_statement,
        $.return_statement,
        $.try_statement,
        $.declare_statement,
        $.echo_statement,
        $.exit_statement,
        $.unset_statement,
        $.const_declaration,
        $.function_definition,
        $.class_declaration,
        $.interface_declaration,
        $.trait_declaration,
        $.enum_declaration,
        $.namespace_definition,
        $.namespace_use_declaration,
        $.global_declaration,
        $.function_static_declaration,
      ),

    empty_statement: (_) => prec(-1, ";"),

    compound_statement: ($) => seq("{", repeat($.statement), "}"),

    named_label_statement: ($) => seq($.name, ":"),

    expression_statement: ($) => seq($.expression, $._semicolon),

    switch_statement: ($) =>
      seq(
        $._kw_switch,
        field("condition", $.parenthesized_expression),
        field("body", $.switch_block),
      ),

    switch_block: ($) =>
      choice(
        seq(
          "{",
          repeat(choice($.case_statement, $.default_statement)),
          "}",
        ),
        seq(
          ":",
          repeat(choice($.case_statement, $.default_statement)),
          $._kw_endswitch,
          $._semicolon,
        ),
      ),

    case_statement: ($) =>
      seq(
        $._kw_case,
        field("value", $.expression),
        choice(":", ";"),
        repeat($.statement),
      ),

    default_statement: ($) =>
      seq(
        $._kw_default,
        choice(":", ";"),
        repeat($.statement),
      ),

    function_static_declaration: ($) =>
      seq(
        $._kw_static,
        commaSep1($.static_variable_declaration),
        $._semicolon,
      ),

    static_variable_declaration: ($) =>
      seq(
        field("name", $.variable_name),
        optional(seq(
          "=",
          field("value", $.expression),
        )),
      ),

    global_declaration: ($) =>
      seq(
        $._kw_global,
        commaSep1($._simple_variable),
        $._semicolon,
      ),

    namespace_definition: ($) =>
      seq(
        $._kw_namespace,
        choice(
          seq(field("name", $.namespace_name), $._semicolon),
          seq(
            field("name", optional($.namespace_name)),
            field("body", $.compound_statement),
          ),
        ),
      ),

    namespace_use_declaration: ($) =>
      seq(
        $._kw_use,
        choice(
          commaSep1($.namespace_use_clause),
          $._namespace_use_group,
        ),
        $._semicolon,
      ),

    namespace_use_clause: ($) =>
      seq(
        field("type", optional($._namespace_use_type)),
        choice($.name, $.qualified_name),
        optional(seq($._kw_as, field("alias", $.name))),
      ),

    _namespace_use_group: ($) =>
      seq(
        field("type", optional($._namespace_use_type)),
        $.namespace_name,
        "\\",
        field("body", $.namespace_use_group),
      ),

    namespace_use_group: ($) =>
      seq("{", commaSep1($.namespace_use_clause), "}"),

    echo_statement: ($) => seq($._kw_echo, $._expressions, $._semicolon),

    exit_statement: ($) =>
      seq(
        alias(/exit/i, $.exit),
        optional(seq("(", optional($.expression), ")")),
        $._semicolon,
      ),

    unset_statement: ($) =>
      seq(
        "unset",
        "(",
        commaSep1($._variable),
        optional(","),
        ")",
        $._semicolon,
      ),

    declare_statement: ($) =>
      seq(
        $._kw_declare,
        "(",
        $.declare_directive,
        ")",
        choice(
          $.statement,
          $._semicolon,
          seq(
            ":",
            repeat($.statement),
            $._kw_enddeclare,
            $._semicolon,
          ),
        ),
      ),

    declare_directive: ($) =>
      seq(
        choice("ticks", "encoding", "strict_types"),
        "=",
        $.literal,
      ),

    const_declaration: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        repeat($._modifier),
        $._kw_const,
        optional(field("type", $.type)),
        commaSep1(alias($._const_element, $.const_element)),
        $._semicolon,
      ),

    _class_const_declaration: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        optional($.final_modifier),
        repeat($._modifier),
        $._kw_const,
        optional(field("type", $.type)),
        commaSep1(alias($._class_const_element, $.const_element)),
        $._semicolon,
      ),

    if_statement: ($) =>
      seq(
        $._kw_if,
        field("condition", $.parenthesized_expression),
        choice(
          seq(
            field("body", $.statement),
            repeat(field("alternative", $.else_if_clause)),
            optional(field("alternative", $.else_clause)),
          ),
          seq(
            field("body", $.colon_block),
            repeat(
              field(
                "alternative",
                alias($.else_if_clause_2, $.else_if_clause),
              ),
            ),
            optional(
              field("alternative", alias($.else_clause_2, $.else_clause)),
            ),
            $._kw_endif,
            $._semicolon,
          ),
        ),
      ),

    colon_block: ($) =>
      seq(
        ":",
        repeat($.statement),
      ),

    else_if_clause: ($) =>
      seq(
        $._kw_elseif,
        field("condition", $.parenthesized_expression),
        field("body", $.statement),
      ),

    else_clause: ($) =>
      seq(
        $._kw_else,
        field("body", $.statement),
      ),

    else_if_clause_2: ($) =>
      seq(
        $._kw_elseif,
        field("condition", $.parenthesized_expression),
        field("body", $.colon_block),
      ),

    else_clause_2: ($) =>
      seq(
        $._kw_else,
        field("body", $.colon_block),
      ),

    method_declaration: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        repeat($._modifier),
        $._kw_function,
        optional($.reference_modifier),
        field("name", $.name),
        field("parameters", $.formal_parameters),
        optional($._return_type),
        choice(
          field("body", $.compound_statement),
          $._semicolon,
        ),
      ),

    _member_declaration: ($) =>
      choice(
        alias($._class_const_declaration, $.const_declaration),
        $.property_declaration,
        $.method_declaration,
        $.use_declaration,
      ),

    property_declaration: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        repeat1($._modifier),
        optional(field("type", $.type)),
        commaSep1($.property_element),
        choice(
          $._semicolon,
          $.property_hook_list,
        ),
      ),
    property_element: ($) =>
      seq(
        field("name", $.variable_name),
        optional(seq("=", field("default_value", $.expression))),
      ),

    property_hook_list: ($) => seq("{", repeat($.property_hook), "}"),

    property_hook: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        optional(field("final", $.final_modifier)),
        optional(field("reference_modifier", $.reference_modifier)),
        $.name,
        optional(field("parameters", $.formal_parameters)),
        $._property_hook_body,
      ),

    _property_hook_body: ($) =>
      choice(
        seq("=>", field("body", $.expression), $._semicolon),
        field("body", $.compound_statement),
        $._semicolon,
      ),

    class_interface_clause: ($) =>
      seq(
        $._kw_implements,
        commaSep1($._name),
      ),

    class_declaration: ($) =>
      prec.right(seq(
        optional(field("attributes", $.attr_list)),
        repeat($._modifier),
        $._kw_class,
        field("name", reserved("classes", $.name)),
        optional($.base_clause),
        optional($.class_interface_clause),
        field("body", $.declaration_list),
      )),

    declaration_list: ($) => seq("{", repeat($._member_declaration), "}"),

    trait_declaration: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        $._kw_trait,
        field("name", reserved("classes", $.name)),
        field("body", $.declaration_list),
      ),

    interface_declaration: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        $._kw_interface,
        field("name", reserved("classes", $.name)),
        optional($.base_clause),
        field("body", $.declaration_list),
      ),

    base_clause: ($) =>
      seq(
        $._kw_extends,
        commaSep1($._name),
      ),

    enum_declaration: ($) =>
      prec.right(seq(
        optional(field("attributes", $.attr_list)),
        alias(/enum/i, $.enum),
        field("name", reserved("classes", $.name)),
        optional(seq(":", alias(choice("string", "int"), $.primitive_type))),
        optional($.class_interface_clause),
        field("body", $.enum_declaration_list),
      )),

    enum_declaration_list: ($) =>
      seq("{", repeat($._enum_member_declaration), "}"),

    _enum_member_declaration: ($) =>
      choice(
        alias($._class_const_declaration, $.const_declaration),
        $.enum_case,
        $.method_declaration,
        $.use_declaration,
      ),

    enum_case: ($) =>
      seq(
        optional(field("attributes", $.attr_list)),
        $._kw_case,
        field("name", reserved("nothing", $.name)),
        optional(seq("=", field("value", $.expression))),
        $._semicolon,
      ),

    use_declaration: ($) =>
      seq(
        $._kw_use,
        commaSep1($._name),
        choice($.use_list, $._semicolon),
      ),

    use_list: ($) =>
      seq(
        "{",
        repeat(seq(
          choice(
            $.use_instead_of_clause,
            $.use_as_clause,
          ),
          $._semicolon,
        )),
        "}",
      ),

    use_instead_of_clause: ($) =>
      prec.left(seq(
        $.class_constant_access_expression,
        $._kw_insteadof,
        $.name,
      )),

    use_as_clause: ($) =>
      seq(
        choice($.class_constant_access_expression, $.name),
        $._kw_as,
        choice(
          seq(
            optional($.visibility_modifier),
            $.name,
          ),
          seq(
            $.visibility_modifier,
            optional($.name),
          ),
        ),
      ),

    _namespace_use_type: ($) => choice($._kw_function, $._kw_const),
    _semicolon: (_) => ";",
  },
});
