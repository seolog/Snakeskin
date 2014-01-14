/**!
 * @status stable
 * @version 1.0.0
 */

{template test(asserts)}
	{cdata}<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
	<html>
		<head>
			<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
			<title>Snakeskin.compile</title>
			<link type="text/css" rel="stylesheet" href="http://code.jquery.com/qunit/qunit-1.13.0.css" />

			<script type="text/javascript" src="http://code.jquery.com/jquery-1.10.2.min.js"></script>
			<script type="text/javascript" src="http://code.jquery.com/qunit/qunit-1.11.0.js"></script>
			<script type="text/javascript" src="../build/snakeskin.js"></script>
			<script type="text/javascript">
				Object.create = Object.create || function (obj) {
					var F = function () {};
					F.prototype = obj;
					return new F();
				};
			</script>
		</head>

		<body>
			<h1 id="qunit-header">Test: Snakeskin.compile</h1>
			<h2 id="qunit-banner"></h2>
			<div id="qunit-testrunner-toolbar"></div>
			<h2 id="qunit-userAgent"></h2>
			<ol id="qunit-tests"></ol>

	{/cdata}
			{forEach asserts => el}
				<script type="text/x-snakeskin-template" id="{el.id}">
					{el.tpl|!html}
				</script>

				<script type="text/javascript">
					Snakeskin.compile(document.getElementById('{el.id}'));
					test('{el.id}', function () {cdata}{{/cdata}
						{forEach el.js => el}
							{el|!html}
						{/}
					{cdata}}{/cdata});
				</script>
			{/}
		</body>
	</html>
{/}